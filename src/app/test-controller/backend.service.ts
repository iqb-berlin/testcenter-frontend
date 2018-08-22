import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { ResponseContentType } from '@angular/http';
import { BehaviorSubject ,  Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';


@Injectable()
export class BackendService {

  private unitCache: UnitData[] = [];
  private lastBookletState = '';
  private lastUnitResponses = '';
  private lastUnitRestorePoint = '';

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) { }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getSessionData(sessiontoken: string): Observable<SessionData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<SessionData>(this.serverUrl + 'getSessionData.php', {st: sessiontoken}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  setBookletStatus(sessiontoken: string, state: {}): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    if ((sessiontoken + JSON.stringify(state)) === this.lastBookletState) {
      return new Observable(null);
    } else {
      this.lastBookletState = sessiontoken + JSON.stringify(state);
      return this.http
      .post<string>(this.serverUrl + 'setBookletStatus.php', {st: sessiontoken, state: state}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnit(sessiontoken: string, unitid: string): Observable<UnitData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    const myUnitdata = this.unitCache[unitid];
    if (typeof myUnitdata === 'undefined') {
      return this.http
      .post<UnitData>(this.serverUrl + 'getUnit.php', {st: sessiontoken, u: unitid}, httpOptions)
        .pipe(
          tap(r => this.unitCache[unitid] = r),
          catchError(this.handleError)
        );
    } else {
      return new Observable (observer => {
        observer.next(myUnitdata);
        observer.complete();
      });
    }
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
        catchError(this.handleError)
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
          catchError(this.handleError)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  getUnitResourceTxt(sessiontoken: string, resId: string): Observable<string | ServerError> {
    const myHttpOptions = {
          headers: new HttpHeaders({
            'Content-Type':  'application/json'
          }),
          responseType: 'text' as 'json'
      };

      return this.http
      .post<string>(this.serverUrl + 'getUnitResourceTxt.php', {st: sessiontoken, r: resId}, myHttpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  // 888888888888888888888888888888888888888888888888888888888888888888
  setUnitResponses(sessiontoken: string, unit: string, unitdata: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    if ((sessiontoken + unit + JSON.stringify(unitdata)) === this.lastUnitResponses) {
      return new Observable(null);
    } else {
      this.lastUnitResponses = sessiontoken + unit + JSON.stringify(unitdata);
      // todo: store the response for evaluation
      return this.http
      .post<string>(this.serverUrl + 'setUnitResponses.php', {st: sessiontoken, u: unit, responses: unitdata}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  setUnitRestorePoint(sessiontoken: string, unit: string, unitdata: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    if ((sessiontoken + unit + JSON.stringify(unitdata)) === this.lastUnitRestorePoint) {
      return new Observable(null);
    } else {
      this.lastUnitRestorePoint = sessiontoken + unit + JSON.stringify(unitdata);
      const myUnitdata: UnitData = this.unitCache[unit];
      if (typeof myUnitdata !== 'undefined') {
        myUnitdata.restorepoint = unitdata;
      }
      return this.http
      .post<string>(this.serverUrl + 'setUnitRestorePoint.php', {st: sessiontoken, u: unit, restorepoint: unitdata}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  setUnitLog(sessiontoken: string, unit: string, unitdata: {}): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<string>(this.serverUrl + 'setUnitLog.php', {st: sessiontoken, u: unit, log: unitdata}, httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  private handleError(errorObj: HttpErrorResponse): Observable<ServerError> {
    const myreturn: ServerError = {
      label: 'Fehler bei Datenübertragung',
      code: errorObj.status
    };
    if (errorObj.status === 401) {
      myreturn.label = 'Fehler: Zugriff verweigert - bitte (neu) anmelden!';
    } else if (errorObj.status === 503) {
      myreturn.label = 'Fehler: Server meldet Datenbankproblem.';
    } else if (errorObj.error instanceof ErrorEvent) {
      myreturn.label = 'Fehler: ' + (<ErrorEvent>errorObj.error).message;
    } else {
      myreturn.label = 'Fehler: ' + errorObj.message;
    }

    return throwError(myreturn.label);
  }
}

export interface SessionData {
  xml: string;
  locked: boolean;
  u: number;
}

export interface UnitData {
  xml: string;
  restorepoint: string;
  status: {};
}

export interface ServerError {
  code: number;
  label: string;
}
