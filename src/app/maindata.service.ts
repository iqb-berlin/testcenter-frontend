import { BackendService } from './backend.service';
import { BehaviorSubject, Subject, forkJoin } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData } from './app.interfaces';
import {CustomtextService, ServerError} from "iqb-components";
import {appconfig, customtextKeySeparator, CustomTextsDefList} from "./app.config";

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private static defaultLoginData: LoginData = {
    logintoken: '',
    persontoken: '',
    mode: '',
    groupname: '',
    loginname: '',
    workspaceName: '',
    booklets: null,
    code: '',
    booklet: 0,
    bookletlabel: '',
    customTexts: {}
  };

  public loginData$ = new BehaviorSubject<LoginData>(MainDataService.defaultLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  constructor(
    private bs: BackendService,
    private cts: CustomtextService
  ) {}

  // ensures consistency
  setNewLoginData(logindata?: LoginData) {
    const myLoginData: LoginData = {
      logintoken: MainDataService.defaultLoginData.logintoken,
      persontoken: MainDataService.defaultLoginData.persontoken,
      mode: MainDataService.defaultLoginData.mode,
      groupname: MainDataService.defaultLoginData.groupname,
      loginname: MainDataService.defaultLoginData.loginname,
      workspaceName: MainDataService.defaultLoginData.workspaceName,
      booklets: MainDataService.defaultLoginData.booklets,
      code: MainDataService.defaultLoginData.code,
      booklet: MainDataService.defaultLoginData.booklet,
      bookletlabel: MainDataService.defaultLoginData.bookletlabel,
      customTexts: MainDataService.defaultLoginData.customTexts // always ignored except right after getting from backend!
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
    if (myLoginData.booklet > 0 && myLoginData.mode === 'hot') {
      forkJoin(
        this.bs.addBookletLogClose(myLoginData.booklet),
        this.bs.lockBooklet(myLoginData.booklet)
      ).subscribe(() => {
        myLoginData.booklet = 0;
        myLoginData.bookletlabel = '';
        this.setNewLoginData(myLoginData);
      });
    } else {
      myLoginData.booklet = 0;
      myLoginData.bookletlabel = '';
      this.setNewLoginData(myLoginData);
    }
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

  public setCustomtextsFromDefList(customtextList: CustomTextsDefList) {
    const myCustomTexts: {[key: string]: string} = {};
    for (const ct of Object.keys(customtextList)) {
      myCustomTexts[customtextList.keyPrefix + customtextKeySeparator + ct] = customtextList[ct].defaultvalue;
    }
    this.cts.addCustomTexts(myCustomTexts);
  }

  public setDefaultCustomtexts(newTexts: {[key: string]: string;}) {
    for (const ctKey of Object.keys(newTexts)) {
      const sepIndex = ctKey.indexOf(customtextKeySeparator);
      if (sepIndex > 1) {
        const keyPrefix = ctKey.slice(0 , sepIndex-1);
        const keyId = ctKey.slice(sepIndex+1);

        switch(keyPrefix) {
          case 'app': {
            appconfig.customtextsApp.defList[keyId].defaultvalue = newTexts[ctKey];
            break;
          }
          case 'login': {
            appconfig.customtextsLogin.defList[keyId].defaultvalue = newTexts[ctKey];
            break;
          }
          case 'booklet': {
            appconfig.customtextsBooklet.defList[keyId].defaultvalue = newTexts[ctKey];
            break;
          }
        }
      }
    }
  }
}
