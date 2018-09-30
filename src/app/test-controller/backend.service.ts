import { ServerError, ErrorHandler } from './../backend.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { ResponseContentType } from '@angular/http';
import { BehaviorSubject ,  Observable, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Authorisation } from '../logindata.service';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'php_tc/';
    }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  saveUnitReview(auth: Authorisation, unit: string, priority: number,
    categories: string, entry: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'addUnitReview.php', {au: auth.toAuthString(), u: unit,
        p: priority, c: categories, e: entry}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  saveBookletReview(auth: Authorisation, priority: number, categories: string, entry: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'addBookletReview.php', {au: auth.toAuthString(),
        p: priority, c: categories, e: entry}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getBookletData(auth: Authorisation): Observable<BookletData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletData>(this.serverUrl + 'getBookletData.php', {au: auth.toAuthString()}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getUnitData(auth: Authorisation, unitid: string): Observable<UnitData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http
    .post<UnitData>(this.serverUrl + 'getUnitData.php', {au: auth.toAuthString(), u: unitid}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  setBookletStatus(auth: Authorisation, state: {}): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    // if ((sessiontoken + JSON.stringify(state)) === this.lastBookletState) {
    //   return new Observable(null);
    // } else {
    //   this.lastBookletState = sessiontoken + JSON.stringify(state);
      return this.http
      .post<string>(this.serverUrl + 'setBookletStatus.php', {au: auth.toAuthString(), state: state}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
    // }
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnitResource(sessiontoken: string, resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          }),
          responseType: 'arraybuffer' as 'json'
      };

    return this.http
    .post<ArrayBuffer>(this.serverUrl + 'getUnitResource.php', {st: sessiontoken, r: resId}, myHttpOptions)
      .pipe(
        map((r: ArrayBuffer) => {
          let str64 = '';
          const alen = r.byteLength;
          for (let i = 0; i < alen; i++) {
            str64 += String.fromCharCode(r[i]);
          }
          return window.btoa(str64);
        }),
        catchError(ErrorHandler.handle)
    );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnitResource64(sessiontoken: string, resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          }),
          responseType: 'text' as 'json'
      };

      return this.http
      .post<string>(this.serverUrl + 'getUnitResource64.php', {st: sessiontoken, r: resId}, myHttpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnitResourceTxt(auth: Authorisation, resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          }),
          responseType: 'text' as 'json'
      };

      return this.http
      .post<string>(this.serverUrl + 'getUnitResourceTxt.php', {au: auth.toAuthString(), r: resId}, myHttpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitResponses(auth: Authorisation, unit: string, unitdata: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitResponse.php', {au: auth.toAuthString(), u: unit, d: JSON.stringify(unitdata)}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitRestorePoint(auth: Authorisation, unit: string, unitdata: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitRestorePoint.php', {au: auth.toAuthString(), u: unit, d: JSON.stringify(unitdata)}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitLog(auth: Authorisation, unit: string, unitdata: string[]): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitLog.php', {au: auth.toAuthString(), u: unit, d: unitdata}, httpOptions)
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }
}

// #############################################################################################

export interface BookletData {
  xml: string;
  locked: boolean;
  u: number;
}

export interface UnitData {
  xml: string;
  restorepoint: string;
  status: {};
}
