import { BackendService, ServerError, LoginData, BookletStatus, BookletData,
  BookletnamesByCode } from './backend.service';
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
  public bookletDbId$ = new BehaviorSubject<number>(+localStorage.getItem('bi'));
  public personToken$ = new BehaviorSubject<string>(localStorage.getItem('pt'));

  // for start.component.ts, but info also for test-controller
  public loginName$ = new BehaviorSubject<string>('');
  public loginMode$ = new BehaviorSubject<string>('');
  public workspaceName$ = new BehaviorSubject<string>('');
  public groupName$ = new BehaviorSubject<string>('');
  public personCode$ = new BehaviorSubject<string>('');
  public bookletLabel$ = new BehaviorSubject<string>('');
  public globalErrorMsg$ = new BehaviorSubject<string>('');
  public bookletsByCode$ = new BehaviorSubject<BookletnamesByCode>(null);
  public bookletData$ = new BehaviorSubject<BookletData[]>([]);
  public loginToken$ = new BehaviorSubject<string>('');
  public loginStatusText$ = new BehaviorSubject<string[]>([]);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  constructor(
    private bs: BackendService
  ) {
    this.personToken$.subscribe((t: string) => localStorage.setItem('pt', t));
    this.bookletDbId$.subscribe((id: number) => localStorage.setItem('bi', id.toString()));

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
            this.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
            this.bookletDbId$.next(0);
            this.personToken$.next('');
          } else {
            const loginData = loginDataUntyped as LoginData;
            this.globalErrorMsg$.next('');
            this.groupName$.next(loginData.groupname);
            this.workspaceName$.next(loginData.workspaceName);
            this.personCode$.next(loginData.code);
            this.bookletsByCode$.next(loginData.codeswithbooklets);
            this.bookletData$.next(loginData.booklets);
            this.loginMode$.next(loginData.mode);
            this.personToken$.next(pt);
            this.loginName$.next(loginData.loginname);

            this.bs.getBookletStatusByDbId(pt, b).subscribe(bookletStatusUntyped => {
              if (bookletStatusUntyped instanceof ServerError) {
                const e = bookletStatusUntyped as ServerError;
                this.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
                this.bookletDbId$.next(0);
              } else {
                const bookletStatus = bookletStatusUntyped as BookletStatus;
                this.globalErrorMsg$.next('');
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
