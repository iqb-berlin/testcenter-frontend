import { BehaviorSubject } from 'rxjs';
import { Injectable, Component, Input, Output, EventEmitter } from '@angular/core';

@Injectable()
export class GlobalStoreService {

  private _loginToken = '';

  // title __________________________________________________
  public pageTitle$ = new BehaviorSubject('IQB-Testcenter - Willkommen');
  updatePageTitle(newTitle) {
    this.pageTitle$.next(newTitle);
  }

  // tokens __________________________________________________
  set loginToken(newToken: string) {
    if (newToken !== this._loginToken) {
      localStorage.setItem('lt', newToken);
      this._loginToken = newToken;
    }
  }
  get loginToken(): string {
    if (this._loginToken.length === 0) {
      this._loginToken = localStorage.getItem('lt');
    }
    return this._loginToken;
  }
}
