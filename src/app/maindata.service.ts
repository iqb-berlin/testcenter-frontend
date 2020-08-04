import {BackendService} from './backend.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {
  AppError,
  AuthData, KeyValuePairs
} from './app.interfaces';
import {CustomtextService} from 'iqb-components';
import {AppConfig} from './config/app.config';

const localStorageAuthDataKey = 'iqb-tc-a';
const localStorageTestConfigKey = 'iqb-tc-c';

@Injectable({
  providedIn: 'root'
})

export class MainDataService {
  public appError$ = new Subject<AppError>();
  public errorReportingSilent = false;
  public isSpinnerOn$ = new BehaviorSubject<boolean>(false);
  public progressVisualEnabled = true;
  public isApiValid = true;
  public appConfig: AppConfig = null;
  public sysCheckAvailable = false;

  public defaultTcHeaderHeight = document.documentElement.style.getPropertyValue('--tc-header-height');
  public defaultTcUnitTitleHeight = document.documentElement.style.getPropertyValue('--tc-unit-title-height');
  public defaultTcUnitPageNavHeight = document.documentElement.style.getPropertyValue('--tc-unit-page-nav-height');

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  static getAuthData(): AuthData {
    let myReturn: AuthData = null;
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry !== null) {
      if (storageEntry.length > 0) {
        try {
          myReturn = JSON.parse(storageEntry as string);
        } catch (e) {
          console.warn('corrupt localStorage authData entry');
          myReturn = null;
        }
      }
    }
    return myReturn;
  }

  static resetAuthData() {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry) {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }

  static getTestConfig(): KeyValuePairs {
    let myReturn: KeyValuePairs = null;
    const storageEntry = localStorage.getItem(localStorageTestConfigKey);
    if (storageEntry !== null) {
      if (storageEntry.length > 0) {
        try {
          myReturn = JSON.parse(storageEntry as string);
        } catch (e) {
          console.warn('corrupt localStorage testConfig entry');
          myReturn = null;
        }
      }
    }
    return myReturn;
  }

  constructor(
    private bs: BackendService,
    private cts: CustomtextService
  ) {
    this.appConfig = new AppConfig(cts);
  }

  setSpinnerOn() {
    this.isSpinnerOn$.next(true);
  }

  setSpinnerOff() {
    this.isSpinnerOn$.next(false);
  }

  setAuthData(authData: AuthData = null) {
    if (authData) {
      if (authData.customTexts) {
        this.cts.addCustomTexts(authData.customTexts);
      }
      localStorage.setItem(localStorageAuthDataKey, JSON.stringify(authData));
    } else {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }

  setTestConfig(testConfig: KeyValuePairs = null) {
    if (testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
  }
}
