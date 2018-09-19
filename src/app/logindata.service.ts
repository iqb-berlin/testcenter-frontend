import { map } from 'rxjs/operators';
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
  public bookletDbId$ = new BehaviorSubject<number>(0);
  public personToken$ = new BehaviorSubject<string>('');

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
    merge(
      this.personCode$,
      this.loginName$,
      this.bookletLabel$
        ).subscribe(t => {
            let myreturn = [];
            const ln = this.loginName$.getValue();
            if (ln.length > 0) {
              myreturn.push('Studie: ' + this.workspaceName$.getValue());
              const c = this.personCode$.getValue();
              myreturn.push('angemeldet als "' + ln + (c.length > 0 ? ('/' + c + '"') : '"'));
              myreturn.push('Gruppe: ' + this.groupName$.getValue() + '/' + this.loginMode$.getValue());
              const bL = this.bookletLabel$.getValue();
              myreturn.push('Testheft: ' + (bL.length > 0 ? ('"' + bL + '" gestartet') : 'kein Test gestartet'));
            } else {
              myreturn = ['nicht angemeldet'];
            }
            this.loginStatusText$.next(myreturn);
      }
    );

    // on reload of application:
    // look for personToken and get booklets and (if stored) selected booklet
    const pt = localStorage.getItem('pt');
    if ((typeof pt !== 'string') || (pt.length === 0)) {
      localStorage.setItem('bi', '');
    } else {
      this.bs.getLoginDataByPersonToken(pt).subscribe(loginDataUntyped => {
        if (loginDataUntyped instanceof ServerError) {
          const e = loginDataUntyped as ServerError;
          this.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
          localStorage.setItem('pt', '');
          localStorage.setItem('bi', '');
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

          const b = localStorage.getItem('bi');
          if (b !== null) {
            this.bs.getBookletStatusByDbId(pt, +b).subscribe(bookletStatusUntyped => {
              if (bookletStatusUntyped instanceof ServerError) {
                const e = bookletStatusUntyped as ServerError;
                this.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
                localStorage.setItem('bi', '');
              } else {
                const bookletStatus = bookletStatusUntyped as BookletStatus;
                this.globalErrorMsg$.next('');
                if (bookletStatus.canStart) {
                  this.bookletDbId$.next(bookletStatus.id);
                  this.bookletLabel$.next(bookletStatus.label);
                } else {
                  localStorage.setItem('bi', '');
                }
              }
            });
          }
        }
      }
    );

    }

    this.personToken$.subscribe(t => localStorage.setItem('pt', t));
    this.bookletDbId$.subscribe(id => localStorage.setItem('bi', id.toString()));
  }

  // *****************************************************
  login(name: string, pw: string) {

  }
}
