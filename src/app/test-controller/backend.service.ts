import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { BookletData, UnitData } from './test-controller.interfaces';
import { ServerError } from './test-controller.classes';


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
  saveUnitReview(pToken: string, bookletDbId: number, unit: string, priority: number,
    categories: string, entry: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'addUnitReview.php', {au: pToken + '##' + bookletDbId.toString(), u: unit,
        p: priority, c: categories, e: entry}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  saveBookletReview(pToken: string, bookletDbId: number, priority: number,
          categories: string, entry: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'addBookletReview.php', {au: pToken + '##' + bookletDbId.toString(),
        p: priority, c: categories, e: entry}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getBookletData(pToken: string, bookletDbId: number): Observable<BookletData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletData>(this.serverUrl + 'getBookletData.php', {au: pToken + '##' + bookletDbId.toString()}, httpOptions)
        .pipe(
          catchError(this.handle)
        );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getUnitData(pToken: string, bookletDbId: number, unitid: string): Observable<UnitData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http
    .post<UnitData>(this.serverUrl + 'getUnitData.php', {au: pToken + '##' + bookletDbId.toString(), u: unitid}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  setBookletStatus(pToken: string, bookletDbId: number, state: {}): Observable<string | ServerError> {
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
      .post<string>(this.serverUrl + 'setBookletStatus.php', {au: pToken + '##' + bookletDbId.toString(), state: state}, httpOptions)
        .pipe(
          catchError(this.handle)
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
        catchError(this.handle)
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
          catchError(this.handle)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnitResourceTxt(pToken: string, bookletDbId: number, resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          }),
          responseType: 'text' as 'json'
      };

      return this.http
      .post<string>(this.serverUrl + 'getUnitResourceTxt.php', {au: pToken + '##' + bookletDbId.toString(), r: resId}, myHttpOptions)
        .pipe(
          catchError(this.handle)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitResponses(pToken: string, bookletDbId: number, unit: string,
        unitdata: string, responseType: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitResponse.php',
            {au: pToken + '##' + bookletDbId.toString(), u: unit, d: JSON.stringify(unitdata), rt: responseType}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitRestorePoint(pToken: string, bookletDbId: number, unit: string, unitdata: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitRestorePoint.php',
        {au: pToken + '##' + bookletDbId.toString(), u: unit, d: JSON.stringify(unitdata)}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  setUnitLog(pToken: string, bookletDbId: number, unit: string, unitdata: string[]): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'setUnitLog.php', {au: pToken + '##' + bookletDbId.toString(), u: unit, d: unitdata}, httpOptions)
      .pipe(
        catchError(this.handle)
      );
  }


  handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn: ServerError = null;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 503) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }

    return of(myreturn);
  }
}
