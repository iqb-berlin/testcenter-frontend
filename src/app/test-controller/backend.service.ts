import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BookletData, UnitData, TaggedString } from './test-controller.interfaces';
import {ServerError} from "iqb-components";


@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private serverSlimUrl_GET = '';
  private serverSlimUrl_POST = '';

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverSlimUrl_GET = this.serverUrl + 'php_tc/tc_get.php/';
      this.serverSlimUrl_POST = this.serverUrl + 'php_tc/tc_post.php/';
      this.serverUrl = this.serverUrl + 'php_tc/';
    }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // send reviews
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  saveUnitReview(unit: string, priority: number,
      categories: string, entry: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'review', {u: unit, p: priority, c: categories, e: entry})
        .pipe(
          catchError(this.handle)
        );
  }

  // ------------------------------
  saveBookletReview(priority: number, categories: string, entry: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'review', {p: priority, c: categories, e: entry})
        .pipe(
          catchError(this.handle)
        );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // get
  // 7777777777777777777777777777777777777777777777777777777777777777777777

  getBookletData(): Observable<BookletData | ServerError> {
    return this.http.get<BookletData>(this.serverSlimUrl_GET + 'bookletdata')
        .pipe(
          catchError(this.handle)
        );
  }

  // ------------------------------
  getUnitData(unitid: string): Observable<UnitData | ServerError> {
    return this.http.get<UnitData>(this.serverSlimUrl_GET + 'unitdata/' + unitid)
      .pipe(
        catchError(this.handle)
      );
  }

  // ------------------------------
  getResource(internalKey: string, resId: string, versionning = false): Observable<TaggedString | ServerError> {
    const myHttpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        }),
        responseType: 'text' as 'json'
    };
    const urlSuffix = versionning ? '?v=1' : '';
    return this.http.get<string>(this.serverSlimUrl_GET + 'resource/' + resId + urlSuffix, myHttpOptions)
      .pipe(
        map(def => <TaggedString>{tag: internalKey, value: def}),
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // send responses, status, logs
  // 7777777777777777777777777777777777777777777777777777777777777777777777
  addBookletLog(bookletDbId: number, timestamp: number, entry: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'log', {b: bookletDbId, t: timestamp, e: entry})
        .pipe(
          catchError(this.handle)
        );
  }

  setBookletState(bookletDbId: number, stateKey: string, state: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'state', {b: bookletDbId, sk: stateKey, s: state})
        .pipe(
          catchError(this.handle)
        );
  }

  setUnitState(unitDbKey: string, stateKey: string, state: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'state', {u: unitDbKey, sk: stateKey, s: state})
        .pipe(
          catchError(this.handle)
        );
  }

  addUnitLog(bookletDbId: number, timestamp: number, unitDbKey: string, entry: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'log', {b: bookletDbId, u: unitDbKey, t: timestamp, e: entry})
        .pipe(
          catchError(this.handle)
        );
  }

  newUnitResponse(bookletDbId: number, timestamp: number,
            unitDbKey: string, response: string, responseType: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'response', {b: bookletDbId, u: unitDbKey, t: timestamp, r: response, rt: responseType})
        .pipe(
          catchError(this.handle)
        );
  }

  newUnitRestorePoint(bookletDbId: number, unitDbKey: string, timestamp: number, restorePoint: string): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_POST + 'restorepoint', {b: bookletDbId, u: unitDbKey, t: timestamp, r: restorePoint})
        .pipe(
          catchError(this.handle)
        );
  }



  // 7777777777777777777777777777777777777777777777777777777777777777777777
  handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 504) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }

    return of(myreturn);
  }
}


  // ------------------------------
  // getUnitResource(sessiontoken: string, resId: string): Observable<string | ServerError> {
  //   const myHttpOptions = {
  //         headers: new HttpHeaders({
  //           'Content-Type':  'application/json'
  //         }),
  //         responseType: 'arraybuffer' as 'json'
  //     };

  //   return this.http
  //   .post<ArrayBuffer>(this.serverUrl + 'getUnitResource.php', {st: sessiontoken, r: resId}, myHttpOptions)
  //     .pipe(
  //       map((r: ArrayBuffer) => {
  //         let str64 = '';
  //         const alen = r.byteLength;
  //         for (let i = 0; i < alen; i++) {
  //           str64 += String.fromCharCode(r[i]);
  //         }
  //         return window.btoa(str64);
  //       }),
  //       catchError(this.handle)
  //   );
  // }
  // getUnitResource64(sessiontoken: string, resId: string): Observable<string | ServerError> {
  //   const myHttpOptions = {
  //         headers: new HttpHeaders({
  //           'Content-Type':  'application/json'
  //         }),
  //         responseType: 'text' as 'json'
  //     };

  //     return this.http
  //     .post<string>(this.serverUrl + 'getUnitResource64.php', {st: sessiontoken, r: resId}, myHttpOptions)
  //       .pipe(
  //         catchError(this.handle)
  //       );
  // }
