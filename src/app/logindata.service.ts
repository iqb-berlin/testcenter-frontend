import { BackendService, ServerError, LoginData, BookletStatus, BookletDataList } from './backend.service';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogindataService {

  public pageTitle$ = new BehaviorSubject<string>('IQB-Testcenter - Willkommen');
  public loginName$ = new BehaviorSubject<string>('');
  public loginMode$ = new BehaviorSubject<string>('');
  public workspaceName$ = new BehaviorSubject<string>('');
  public groupName$ = new BehaviorSubject<string>('');
  public personToken$ = new BehaviorSubject<string>('');
  public personCode$ = new BehaviorSubject<string>('');
  public bookletDbId$ = new BehaviorSubject<number>(0);
  public bookletLabel$ = new BehaviorSubject<string>('');
  public globalErrorMsg$ = new BehaviorSubject<string>('');
  public allBooklets$ = new BehaviorSubject<BookletDataList>(null);

  constructor(
    private bs: BackendService
  ) {
    // on reload of application:
    // look for personToken and get booklets and (if stored) selected booklet
    const pt = localStorage.getItem('pt');
    if ((typeof pt !== 'string') || (pt.length === 0)) {
      localStorage.setItem('bi', '');
      console.log('yop');
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
          this.allBooklets$.next(loginData.booklets);
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
