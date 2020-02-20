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
  private static get defaultLoginData(): LoginData {
    return {
      logintoken: '',
      persontoken: '',
      mode: '',
      groupname: '',
      loginname: '',
      name: '',
      workspaceName: '',
      booklets: null,
      code: '',
      booklet: 0,
      bookletlabel: '',
      customTexts: {},
      admintoken: '',
      workspaces: [],
      is_superadmin: false,
      costumTexts: {}
    }
  }

  public loginData$ = new BehaviorSubject<LoginData>(MainDataService.defaultLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  public get adminToken(): string {
    const myLoginData = this.loginData$.getValue();
    if (myLoginData) {
      return myLoginData.admintoken;
    } else {
      return '';
    }
  }

  constructor(
    private bs: BackendService,
    private cts: CustomtextService
  ) {}

  // ensures consistency
  setNewLoginData(logindata?: LoginData) {
    const myLoginData: LoginData = MainDataService.defaultLoginData;
    if (!logindata) {
      logindata = MainDataService.defaultLoginData;
    }

    if ((logindata.admintoken)) { //.length > 0) && (logindata.name.length > 0)) {
      myLoginData.admintoken = logindata.admintoken;
      if (logindata.name) {
        myLoginData.loginname = logindata.name;
      } else {
        myLoginData.loginname = logindata.loginname;
      }
      myLoginData.workspaces = logindata.workspaces;
      myLoginData.is_superadmin = logindata.is_superadmin;
    } else if (
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

    this.loginData$.next(myLoginData);
    localStorage.setItem('lt', myLoginData.logintoken);
    localStorage.setItem('at', myLoginData.admintoken);
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

  public addCustomtextsFromDefList(customtextList: CustomTextsDefList) {
    const myCustomTexts: {[key: string]: string} = {};
    for (const ct of Object.keys(customtextList.defList)) {
      myCustomTexts[customtextList.keyPrefix + customtextKeySeparator + ct] = customtextList.defList[ct].defaultvalue;
    }
    this.cts.addCustomTexts(myCustomTexts);
  }

  public setDefaultCustomtexts(newTexts: {[key: string]: string;}) {
    if (newTexts) {
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
}
