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

  // ------------------------------
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
  getResource(resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        }),
        responseType: 'text' as 'json'
    };
    return this.http.get<string>(this.serverSlimUrl_GET + 'resource/' + resId, myHttpOptions)
      .pipe(
        catchError(this.handle)
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // send responses, status, logs
  // 7777777777777777777777777777777777777777777777777777777777777777777777
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

  // ------------------------------
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

  // ------------------------------
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

  // ------------------------------
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


  // 7777777777777777777777777777777777777777777777777777777777777777777777
  handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn: ServerError = null;
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
