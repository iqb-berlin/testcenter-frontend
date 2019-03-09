import { ServerError } from './backend.service';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData } from './app.interfaces';

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
    booklet: 0,
    bookletlabel: ''
  };

  public loginData$ = new BehaviorSubject<LoginData>(this.standardLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();


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
      booklet: this.standardLoginData.booklet,
      bookletlabel: this.standardLoginData.bookletlabel
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
              if (myLoginData.booklet > 0) {
                myLoginData.bookletlabel = logindata.bookletlabel;
              }
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
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setBookletDbId ( personToken: string, bId: number, bLabel: string) {
    const myLoginData = this.loginData$.getValue();
    myLoginData.persontoken = personToken;
    myLoginData.booklet = bId;
    myLoginData.bookletlabel = bLabel;
    this.setNewLoginData(myLoginData);
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  endBooklet () {
    const myLoginData = this.loginData$.getValue();
    myLoginData.booklet = 0;
    myLoginData.bookletlabel = '';
    this.setNewLoginData(myLoginData);
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getCode(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.code;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getBookletLabel(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.bookletlabel;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getPersonToken(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.persontoken;
  }
}
