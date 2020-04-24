import {BackendService} from './backend.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {Injectable} from '@angular/core';
import {
  AppError,
  AuthData
} from './app.interfaces';
import {CustomtextService} from 'iqb-components';
import {AppConfig} from './app.config';

const localStorageAuthDataKey = 'iqb-tc';

@Injectable({
  providedIn: 'root'
})

export class MainDataService {
  public appError$ = new BehaviorSubject<AppError>(null);
  public isSpinnerOn$ = new BehaviorSubject<boolean>(false);
  public progressVisualEnabled = true;
  public isApiVersionValid = true;
  public appConfig: AppConfig = null;

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
  ) {
    this.appConfig = new AppConfig(cts);
  }

  setSpinnerOn() {
    this.isSpinnerOn$.next(true)
  }

  setSpinnerOff() {
    this.isSpinnerOn$.next(false)
  }

  setAuthData(authData: AuthData = null) {
    if (authData) {
      if (authData.customTexts) {
        this.cts.addCustomTexts(authData.customTexts);
      }
      MainDataService.setAuthDataToLocalStorage(authData);
    } else {
      MainDataService.setAuthDataToLocalStorage();
    }
  }
}
