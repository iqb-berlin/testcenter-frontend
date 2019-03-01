import { BackendService, ServerError } from './backend.service';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData, BookletStatus, BookletData, BookletDataListByCode } from './app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private readonly standardLoginData: LoginData = {
    logintoken: '',
    persontoken: '',
    mode: '',
    groupname: '',
    loginname: '',
    workspaceName: '',
    booklets: null,
    code: '',
    booklet: 0
  };

  public loginData$ = new BehaviorSubject<LoginData>(this.standardLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  constructor( private bs: BackendService ) {
    this.loginData$.subscribe(loginData => {
      localStorage.setItem('lt', loginData.logintoken);
      localStorage.setItem('pt', loginData.persontoken);
      localStorage.setItem('bi', loginData.booklet.toString());
    });
  }


  // call only from app.component.ts to restore data after reload
  loadLoginStatus() {
    const loginToken = localStorage.getItem('lt');
    if (loginToken !== null) {
      const personToken = localStorage.getItem('pt');
      let bookletDbId = 0;
      if (personToken !== null) {
        const bookletDbIdStr = localStorage.getItem('bi');
        if (bookletDbIdStr !== null) {
          bookletDbId = Number(bookletDbId);
        }
      }

      this.bs.getLoginData(loginToken, personToken).subscribe(ld => {
        if (ld instanceof ServerError) {
          this.setNewLoginData();
        } else {
          const loginData = ld as LoginData;
          // dirty: one should check whether the localStored booklet is valid
          loginData.booklet = bookletDbId;
          this.setNewLoginData(loginData);
        }
      });
    } else {
      this.setNewLoginData();
    }
  }

  // ensures consistency
  setNewLoginData(logindata?: LoginData) {
    const myLoginData = this.standardLoginData;
    if (logindata) {
      if (
        (logindata.logintoken.length > 0) &&
        (logindata.loginname.length > 0) &&
        (logindata.mode.length > 0) &&
        (logindata.groupname.length > 0) &&
        (logindata.workspaceName.length > 0) &&
        (logindata.booklets)) {

          const validCodes = Object.keys(logindata.booklets);
          if (validCodes.length > 0) {
            myLoginData.logintoken = logindata.logintoken;
            myLoginData.loginname = logindata.loginname;
            myLoginData.mode = logindata.mode;
            myLoginData.groupname = logindata.groupname;
            myLoginData.workspaceName = logindata.workspaceName;
            myLoginData.booklets = logindata.booklets;
            if (logindata.code.length > 0) {
              if (logindata.code in logindata.booklets) {
                myLoginData.code = logindata.code;
              }
            }
            if (logindata.persontoken.length > 0) {
              myLoginData.persontoken = logindata.persontoken;
              myLoginData.booklet = logindata.booklet;
            }
          }
      }

    }
    this.loginData$.next(myLoginData);
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setCode ( newCode: string) {
    const myLoginData = this.loginData$.getValue();
    myLoginData.code = newCode;
    this.setNewLoginData(myLoginData);
  }
}
