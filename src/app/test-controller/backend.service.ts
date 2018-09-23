import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { ResponseContentType } from '@angular/http';
import { BehaviorSubject ,  Observable, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private lastBookletState = '';
  private lastUnitResponses = '';
  private lastUnitRestorePoint = '';
  private itemplayers: {[filename: string]: string} = {};

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'php_tc/';
    }

  private normaliseFileName(fn: string, ext: string): string {
    fn = fn.toUpperCase();
    ext = ext.toUpperCase();
    if (ext.slice(0, 1) !== '.') {
      ext = '.' + ext;
    }

    if (fn.slice(-(ext.length)) === ext) {
      return fn;
    } else {
      return fn + ext;
    }
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  saveUnitReview(auth: Authorisation, unitDbId: number, priority: number,
    categories: string, entry: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
    .post<boolean>(this.serverUrl + 'addUnitReview.php', {au: auth.toAuthString(), u: unitDbId,
        p: priority, c: categories, e: entry}, httpOptions)
      .pipe(
        catchError(this.handleError)
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
        catchError(this.handleError)
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
          catchError(this.handleError)
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
        catchError(this.handleError)
      );
  }

  // 888888888888888888888888888888888888888888888888888888888888888888
  loadItemplayerOk(auth: Authorisation, unitDefinitionType: string): Observable<boolean> {
    unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
    if (this.itemplayers.hasOwnProperty(unitDefinitionType)) {
      return of(true);
    } else {
      // to avoid multiple calls before returning:
      this.itemplayers[unitDefinitionType] = null;
      return this.getUnitResourceTxt(auth, unitDefinitionType)
          .pipe(
            switchMap(myData => {
              if (myData instanceof ServerError) {
                return of(false);
              } else {
                const itemplayerData = myData as string;
                if (itemplayerData.length > 0) {
                  this.itemplayers[unitDefinitionType] = itemplayerData;
                  console.log(Object.keys(this.itemplayers));
                  return of(true);
                } else {
                  return of(false);
                }
              }
            }));
    }
  }


  // 888888888888888888888888888888888888888888888888888888888888888888
  getItemplayer(unitDefinitionType: string): string {
    unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
    if (this.itemplayers.hasOwnProperty(unitDefinitionType)) {
      return this.itemplayers[unitDefinitionType];
    } else {
      return '';
    }
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
    return this.http
    .post<string>(this.serverUrl + 'setUnitRestorePoint.php', {st: sessiontoken, u: unit, restorepoint: unitdata}, httpOptions)
      .pipe(
        catchError(this.handleError)
      );
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
    const myreturn = new ServerError(errorObj.status, 'Fehler bei Datenübertragung');

    if (errorObj.status === 401) {
      myreturn.label = 'Fehler: Zugriff verweigert - bitte (neu) anmelden!';
    } else if (errorObj.status === 503) {
      myreturn.label = 'Fehler: Server meldet Datenbankproblem.';
    } else if (errorObj.error instanceof ErrorEvent) {
      myreturn.label = 'Fehler: ' + (<ErrorEvent>errorObj.error).message;
    } else {
      myreturn.label = 'Fehler: ' + errorObj.message;
    }

    return of(myreturn);
  }

  private handleErrorSimple(errorObj: HttpErrorResponse): Observable<boolean> {
    const myreturn = new ServerError(errorObj.status, 'Fehler bei Datenübertragung');

    console.log('handleErrorSimple: ' + errorObj);
    return of(false);
  }
}

// #############################################################################################

// class instead of interface to be able to use instanceof to check type
export class ServerError {
  public code: number;
  public label: string;
  constructor(code: number, label: string) {
    this.code = code;
    this.label = label;
  }
}

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

export interface ServerError {
  code: number;
  label: string;
}

// eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
export class Authorisation {
  readonly personToken: string;
  readonly bookletId: number;

  static fromPersonTokenAndBookletId(personToken: string, bookletId: number): Authorisation {
    return new Authorisation(personToken + '##' + bookletId.toString());
  }

  constructor(authString: string) {
    if ((typeof authString !== 'string') || (authString.length === 0)) {
      this.personToken = '';
      this.bookletId = 0;
    } else {
      const retSplits = authString.split('##');
      this.personToken = retSplits[0];

      if (retSplits.length > 1) {
        this.bookletId = +retSplits[1];
      } else {
        this.bookletId = 0;
      }
    }
  }

  toAuthString(): string {
    return this.personToken + '##' + this.bookletId.toString();
  }

}
