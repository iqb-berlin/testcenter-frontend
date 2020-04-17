import {BackendService} from './backend.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {
  AppError,
  AuthData
} from './app.interfaces';
import {CustomtextService} from 'iqb-components';
import {appconfig, customtextKeySeparator, CustomTextsDefList} from './app.config';

const localStorageAuthDataKey = 'iqb-tc';

@Injectable({
  providedIn: 'root'
})

export class MainDataService {
  public appError$ = new BehaviorSubject<AppError>(null);
  public delayedProcessesCount$ = new BehaviorSubject<number>(0);
  public isApiVersionValid = true;

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  static getAuthDataFromLocalStorage(): AuthData {
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

  setAuthData(authData: AuthData = null) {
    if (authData) {
      if (authData.customTexts) {
        this.cts.addCustomTexts(authData.customTexts);
        authData.customTexts = null;
      }
      MainDataService.setAuthDataToLocalStorage(authData);
    } else {
      MainDataService.setAuthDataToLocalStorage();
    }
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setCode ( newCode: string) {
    /*
    const myLoginData = this.loginData$.getValue();
    myLoginData.code = newCode;
    this.setNewLoginData(myLoginData);

     */
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setBookletDbId ( personToken: string, bId: number, bLabel: string) {
    /*
    const myLoginData = this.loginData$.getValue();
    myLoginData.personToken = personToken;
    myLoginData.testId = bId;
    myLoginData.bookletLabel = bLabel;
    this.setNewLoginData(myLoginData);

     */
  }


  getBookletDbId(): number {

    return 0;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  endBooklet () {
    /*
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

     */
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getCode(): string {

    return 'xx';
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getBookletLabel(): string {

    return 'xx';
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
