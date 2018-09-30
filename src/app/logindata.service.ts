import { BackendService, ServerError, LoginData, BookletStatus, BookletData,
  BookletDataListByCode } from './backend.service';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogindataService {

  // observed only by app.components for the page header
  public pageTitle$ = new BehaviorSubject<string>('IQB-Testcenter - Willkommen');

  // key for test-controller
  // only these two are stored in localStorage
  public bookletDbId$ = new BehaviorSubject<number>(0);
  public personToken$ = new BehaviorSubject<string>('');
  public authorisation$ = new BehaviorSubject<Authorisation>(null);

  // for start.component.ts, but info also for test-controller
  public loginName$ = new BehaviorSubject<string>('');
  public loginMode$ = new BehaviorSubject<string>('');
  public workspaceName$ = new BehaviorSubject<string>('');
  public groupName$ = new BehaviorSubject<string>('');
  public personCode$ = new BehaviorSubject<string>('');
  public bookletLabel$ = new BehaviorSubject<string>('');
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);
  public bookletsByCode$ = new BehaviorSubject<BookletDataListByCode>(null);
  public bookletData$ = new BehaviorSubject<BookletData[]>([]);
  public loginToken$ = new BehaviorSubject<string>('');
  public loginStatusText$ = new BehaviorSubject<string[]>([]);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  constructor(
    private bs: BackendService
  ) {
    const bookletDbId = localStorage.getItem('bi');
    if (localStorage.getItem('bi') !== null) {
      this.bookletDbId$.next(+bookletDbId);
    }
    const personToken = localStorage.getItem('pt');
    if (localStorage.getItem('pt') !== null) {
      this.personToken$.next(personToken);
    }

    this.personToken$.subscribe((t: string) => localStorage.setItem('pt', t));
    this.bookletDbId$.subscribe((id: number) => {
      localStorage.setItem('bi', id.toString());
      const pTok = this.personToken$.getValue();
      const auth = this.authorisation$.getValue();
      if ((pTok.length > 0) && (id > 0)) {
        this.authorisation$.next(Authorisation.fromPersonTokenAndBookletId(pTok, id));
      } else if (auth !== null) {
        this.authorisation$.next(null);
      }
    });

    merge(
      this.personCode$,
      this.loginName$,
      this.bookletLabel$
        ).subscribe(t => {
            const ln = this.loginName$.getValue();
            const bL = this.bookletLabel$.getValue();
            const c = this.personCode$.getValue();
            if ((ln !== null) && (bL !== null) && (c !== null)) {
              let myreturn = [];
              if (ln.length > 0) {
                myreturn.push('Studie: ' + this.workspaceName$.getValue());
                myreturn.push('angemeldet als "' + ln + (c.length > 0 ? ('/' + c + '"') : '"'));
                myreturn.push('Gruppe: ' + this.groupName$.getValue());
                const loginmode = this.loginMode$.getValue();
                if (loginmode === 'trial') {
                  myreturn.push('Ausführungsmodus "trial": Die Zeit-Beschränkungen, die eventuell ' +
                              'für das Testheft oder bestimmte Aufgaben festgelegt wurden, gelten nicht. Sie können ' +
                              'Kommentare über das Menü oben rechts speichern.');
                } else if (loginmode === 'review') {
                  myreturn.push('Ausführungsmodus "review": Beschränkungen für Zeit und Navigation sind nicht wirksam. Antworten werden ' +
                              'nicht gespeichert. Sie können ' +
                              (bL.length > 0 ? ' für das aktuelle Testheft bzw. die Aufgaben ' : ' nach der Auswahl eines Testheftes ') +
                              'Kommentare über das Menü oben rechts speichern.');
                }
                myreturn.push('Testheft: ' + (bL.length > 0 ? ('"' + bL + '" gestartet') : 'kein Test gestartet'));
              } else {
                myreturn = ['nicht angemeldet'];
              }
              this.loginStatusText$.next(myreturn);
            }
      }
    );

    // on reload of application:
    // look for personToken and get booklets and (if stored) selected booklet
    const pt = this.personToken$.getValue();
    if ((typeof pt !== 'string') || (pt.length === 0)) {
      this.bookletDbId$.next(0);
    } else {
      const b = this.bookletDbId$.getValue();
      if (b > 0) {
        this.bs.getLoginDataByPersonToken(pt).subscribe(loginDataUntyped => {
          if (loginDataUntyped instanceof ServerError) {
            const e = loginDataUntyped as ServerError;
            this.globalErrorMsg$.next(e);
            this.bookletDbId$.next(0);
            this.personToken$.next('');
          } else {
            const loginData = loginDataUntyped as LoginData;
            this.globalErrorMsg$.next(null);
            this.groupName$.next(loginData.groupname);
            this.workspaceName$.next(loginData.workspaceName);
            this.personCode$.next(loginData.code);
            this.bookletsByCode$.next(loginData.booklets);
            this.bookletData$.next(loginData.booklets[loginData.code]);
            this.loginMode$.next(loginData.mode);
            this.personToken$.next(pt);
            this.loginName$.next(loginData.loginname);

            this.bs.getBookletStatusByDbId(pt, b).subscribe(bookletStatusUntyped => {
              if (bookletStatusUntyped instanceof ServerError) {
                const e = bookletStatusUntyped as ServerError;
                this.globalErrorMsg$.next(e);
                this.bookletDbId$.next(0);
              } else {
                const bookletStatus = bookletStatusUntyped as BookletStatus;
                this.globalErrorMsg$.next(null);
                if (bookletStatus.canStart) {
                  this.bookletLabel$.next(bookletStatus.label);
                } else {
                  this.bookletDbId$.next(0);
                }
              }
            });
          }
        });
      } else {
        this.personToken$.next('');
      }
    }
  }
}

// eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
export class Authorisation {
  readonly personToken: string;
  readonly bookletId: number;

  static fromPersonTokenAndBookletId(personToken: string, bookletId: number): Authorisation {
    return new Authorisation(personToken + '##' + bookletId.toString());
  }

  constructor(authString: string) {
    if ((typeof authString !== 'string') || (authString.length === 0)) {
      this.personToken = '';
      this.bookletId = 0;
    } else {
      const retSplits = authString.split('##');
      this.personToken = retSplits[0];

      if (retSplits.length > 1) {
        this.bookletId = +retSplits[1];
      } else {
        this.bookletId = 0;
      }
    }
  }

  toAuthString(): string {
    return this.personToken + '##' + this.bookletId.toString();
  }
}
