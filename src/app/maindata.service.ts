import { BackendService } from './backend.service';
import { BehaviorSubject, Subject, forkJoin } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData } from './app.interfaces';
import { CustomtextService, ServerError } from 'iqb-components';
import { appconfig, customtextKeySeparator, CustomTextsDefList } from './app.config';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private static get defaultLoginData(): LoginData {
    return {
      loginToken: '',
      personToken: '',
      mode: '',
      groupName: '',
      name: '',
      workspaceName: '',
      booklets: null,
      code: '',
      testId: 0,
      bookletLabel: '',
      customTexts: {},
      adminToken: '',
      workspaces: [],
      isSuperadmin: false
    };
  }

  public loginData$ = new BehaviorSubject<LoginData>(MainDataService.defaultLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  public get adminToken(): string {
    const myLoginData = this.loginData$.getValue();
    if (myLoginData) {
      return myLoginData.adminToken;
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

    if ((logindata.adminToken)) { // .length > 0) && (logindata.name.length > 0)) {
      myLoginData.adminToken = logindata.adminToken;
      myLoginData.name = logindata.name;
      myLoginData.workspaces = logindata.workspaces;
      myLoginData.isSuperadmin = logindata.isSuperadmin;
    } else if (
      (logindata.loginToken.length > 0) &&
      (logindata.name.length > 0) &&
      (logindata.mode.length > 0) &&
      (logindata.groupName.length > 0) &&
      (logindata.workspaceName.length > 0) &&
      (logindata.booklets)) {

        const validCodes = Object.keys(logindata.booklets);
        if (validCodes.length > 0) {
          myLoginData.loginToken = logindata.loginToken;
          myLoginData.name = logindata.name;
          myLoginData.mode = logindata.mode;
          myLoginData.groupName = logindata.groupName;
          myLoginData.workspaceName = logindata.workspaceName;
          myLoginData.booklets = logindata.booklets;
          if (logindata.code.length > 0) {
            if (logindata.code in logindata.booklets) {
              myLoginData.code = logindata.code;
            }
          }
          if (logindata.personToken.length > 0) {
            myLoginData.personToken = logindata.personToken;
            myLoginData.testId = logindata.testId;
            if (myLoginData.testId > 0) {
              myLoginData.bookletLabel = logindata.bookletLabel;
            }
          }
        }
    }

    this.loginData$.next(myLoginData);
    localStorage.setItem('lt', myLoginData.loginToken);
    localStorage.setItem('at', myLoginData.adminToken);
    localStorage.setItem('pt', myLoginData.personToken);
    localStorage.setItem('bi', myLoginData.testId.toString());
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
    myLoginData.personToken = personToken;
    myLoginData.testId = bId;
    myLoginData.bookletLabel = bLabel;
    this.setNewLoginData(myLoginData);
  }


  getBookletDbId(): number {

    return this.loginData$.getValue().testId;
  }


  getWorkspaceName(ws: number): string {
    let myreturn = '';
    if (ws > 0) {
      const myLoginData = this.loginData$.getValue();
      if ((myLoginData !== null) && (myLoginData.workspaces.length > 0)) {
        for (let i = 0; i < myLoginData.workspaces.length; i++) {
          // tslint:disable-next-line:triple-equals - one is float, other is int
          if (myLoginData.workspaces[i].id == ws) {
            myreturn = myLoginData.workspaces[i].name;
            break;
          }
        }
      }
    }
    return myreturn;
  }

  getWorkspaceRole(ws: number): string {
    let myreturn = '';
    if (ws > 0) {
      const myLoginData = this.loginData$.getValue();
      if ((myLoginData !== null) && (myLoginData.workspaces.length > 0)) {
        for (let i = 0; i < myLoginData.workspaces.length; i++) {
          // tslint:disable-next-line:triple-equals - one is float, other is int
          if (myLoginData.workspaces[i].id == ws) {
            myreturn = myLoginData.workspaces[i].role;
            break;
          }
        }
      }
    }
    return myreturn;
  }


  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  endBooklet () {
    const myLoginData = this.loginData$.getValue();
    if (myLoginData.testId > 0 && myLoginData.mode === 'hot') {
      forkJoin(
        this.bs.addBookletLogClose(myLoginData.testId),
        this.bs.lockBooklet(myLoginData.testId)
      ).subscribe(() => {
        myLoginData.testId = 0;
        myLoginData.bookletLabel = '';
        this.setNewLoginData(myLoginData);
      });
    } else {
      myLoginData.testId = 0;
      myLoginData.bookletLabel = '';
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
    return myLoginData.bookletLabel;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getPersonToken(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.personToken;
  }

  public addCustomtextsFromDefList(customtextList: CustomTextsDefList) {
    const myCustomTexts: {[key: string]: string} = {};
    for (const ct of Object.keys(customtextList.defList)) {
      myCustomTexts[customtextList.keyPrefix + customtextKeySeparator + ct] = customtextList.defList[ct].defaultvalue;
    }
    this.cts.addCustomTexts(myCustomTexts);
  }

 public setDefaultCustomtexts(newTexts: {[key: string]: string}) {
    if (newTexts) {
      for (const ctKey of Object.keys(newTexts)) {
        const sepIndex = ctKey.indexOf(customtextKeySeparator);
        if (sepIndex > 1) {
          const keyPrefix = ctKey.slice(0 , sepIndex - 1);
          const keyId = ctKey.slice(sepIndex + 1);

          switch (keyPrefix) {
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
