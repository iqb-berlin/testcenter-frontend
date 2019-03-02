import { BackendService, ServerError } from './backend.service';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData, BookletStatus, BookletData, BookletDataListByCode } from './app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private standardLoginData: Readonly<LoginData> = {
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


  constructor( private bs: BackendService ) { }


  // call only from app.component.ts to restore data after reload
  loadLoginStatus() {
    const loginToken = localStorage.getItem('lt');
    if (loginToken !== null) {
      if (loginToken.length > 0) {
        let personToken = localStorage.getItem('pt');
        let bookletDbId = 0;
        if (personToken !== null) {
          if (personToken.length > 0) {
            const bookletDbIdStr = localStorage.getItem('bi');
            if (bookletDbIdStr !== null) {
              bookletDbId = Number(bookletDbId);
            }
          }
        } else {
          personToken = '';
        }
        let code = localStorage.getItem('c');
        if (code === null) {
          code = '';
        }

        this.bs.getLoginData(loginToken, personToken).subscribe(ld => {
          if (ld instanceof ServerError) {
            this.setNewLoginData();
          } else {
            const loginData = ld as LoginData;
            // dirty: one should check whether the localStored booklet is valid
            loginData.logintoken = loginToken;
            loginData.persontoken = personToken;
            if (personToken.length === 0) {
              loginData.code = code;
            }
            loginData.booklet = bookletDbId;
            this.setNewLoginData(loginData);
          }
        });
      } else {
        this.setNewLoginData();
      }
    } else {
      this.setNewLoginData();
    }
  }

  // ensures consistency
  setNewLoginData(logindata?: LoginData) {
    const myLoginData: LoginData = {
      logintoken: this.standardLoginData.logintoken,
      persontoken: this.standardLoginData.persontoken,
      mode: this.standardLoginData.mode,
      groupname: this.standardLoginData.groupname,
      loginname: this.standardLoginData.loginname,
      workspaceName: this.standardLoginData.workspaceName,
      booklets: this.standardLoginData.booklets,
      code: this.standardLoginData.code,
      booklet: this.standardLoginData.booklet
    };

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
    localStorage.setItem('lt', myLoginData.logintoken);
    localStorage.setItem('pt', myLoginData.persontoken);
    localStorage.setItem('bi', myLoginData.booklet.toString());
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setCode ( newCode: string) {
    const myLoginData = this.loginData$.getValue();
    myLoginData.code = newCode;
    this.setNewLoginData(myLoginData);
    localStorage.setItem('c', myLoginData.code);
  }
}
