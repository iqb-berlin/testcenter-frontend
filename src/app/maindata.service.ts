import {BackendService} from './backend.service';
import {BehaviorSubject, forkJoin, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {AccessRightList, AppError, AuthData, AuthType, LoginData} from './app.interfaces';
import {CustomtextService, ServerError} from 'iqb-components';
import {appconfig, customtextKeySeparator, CustomTextsDefList} from './app.config';

const localStorageAuthDataKey = 'iqb-tc';

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
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null); // TODO remove globalErrorMsg$
  public appError$ = new BehaviorSubject<AppError>(null);
  public delayedProcessesCount$ = new BehaviorSubject<number>(0);
  public apiVersionProblem = false;

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  public get adminToken(): string {
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.authTypes.indexOf(AuthType.ADMIN) >= 0) {
          return authData.token;
        }
      }
    }
    return '';
  }
  public get isSuperAdmin(): boolean {
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.authTypes.indexOf(AuthType.SUPERADMIN) >= 0) {
          return true;
        }
      }
    }
    return false;
  }
  public get loginToken(): string {
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.authTypes.indexOf(AuthType.LOGIN) >= 0) {
          return authData.token;
        }
      }
    }
    return '';
  }
  public get personToken(): string {
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.authTypes.indexOf(AuthType.PERSON) >= 0) {
          return authData.token;
        }
      }
    }
    return '';
  }

  public get workspaces(): AccessRightList {
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.authTypes.indexOf(AuthType.ADMIN) >= 0) {
          return authData.accessRights;
        }
      }
    }
    return {};
  }

  private static getAuthDataFromLocalStorage(): AuthData {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry !== null) {
      if (storageEntry.length > 0) {
        return JSON.parse(storageEntry as string);
      }
    }
    return null;
  }

  private static setAuthDataToLocalStorage(authData: AuthData = null) {
    if (authData) {
      localStorage.setItem(localStorageAuthDataKey, JSON.stringify(authData));
    } else {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }

  constructor(
    private bs: BackendService,
    private cts: CustomtextService
  ) {}

  incrementDelayedProcessesCount() {
    this.delayedProcessesCount$.next(this.delayedProcessesCount$.getValue() + 1);
  }

  decrementDelayedProcessesCount() {
    const dpc = this.delayedProcessesCount$.getValue();
    if (dpc > 0) {
      this.delayedProcessesCount$.next(dpc - 1);
    }
  }

  setAuthData(loginData: LoginData = null) {
    if (loginData) {
      const authData = <AuthData>{
        token: '',
        authTypes: [],
        displayName: '',
        accessRights: {}
      };
      if (loginData.adminToken) {
        authData.token = loginData.adminToken;
        authData.displayName = loginData.name;
        authData.authTypes.push(AuthType.ADMIN);
        if (loginData.isSuperadmin) {
          authData.authTypes.push(AuthType.SUPERADMIN);
        }
        for (let ws of loginData.workspaces) {
          authData.accessRights[ws.id.toString()] = ws.name;
        }
        MainDataService.setAuthDataToLocalStorage(authData);
      } else if (loginData.loginToken) {
        authData.token = loginData.loginToken;
        authData.displayName = loginData.name;
        authData.authTypes.push(AuthType.LOGIN);
        MainDataService.setAuthDataToLocalStorage(authData);
      } else if (loginData.personToken) {
        authData.token = loginData.personToken;
        authData.displayName = loginData.name;
        authData.authTypes.push(AuthType.PERSON);
        if (loginData.code) {
          const bookletList = loginData.booklets[loginData.code];
          if (bookletList) {
            for (let b of bookletList) {
              authData.accessRights[b] = b;
            }
          }
        } else {
          for (let b of loginData.booklets[0]) {
            authData.accessRights[b] = b;
          }
        }
        MainDataService.setAuthDataToLocalStorage(authData);
      } else {
        MainDataService.setAuthDataToLocalStorage();
      }
    } else {
      MainDataService.setAuthDataToLocalStorage();
    }
  }

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
