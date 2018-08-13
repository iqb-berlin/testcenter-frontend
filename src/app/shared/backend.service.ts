import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';





@Injectable()
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) { }

  /*
  getStatus(admintoken: string, logintoken: string, sessiontoken: string): Observable<LoginResponseData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LoginResponseData>(this.serverUrl + 'getStatus.php', {at: admintoken, lt: logintoken, st: sessiontoken}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  } */

  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  testlogin(name: string, password: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string>(this.serverUrl + 'testlogin.php', {n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getSessions(token: string): Observable<GetBookletsResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetBookletsResponseData>(this.serverUrl + 'getBooklets.php', {lt: token}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }


  getBookletStatus(logintoken: string, code: string, bookletId: string): Observable<GetBookletResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetBookletResponseData>(this.serverUrl + 'getBookletStatus.php', {
        lt: logintoken, c: code, b: bookletId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  startSession(token: string, code: string, bookletFilename: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string>(this.serverUrl + 'startSession.php', {lt: token, c: code, b: bookletFilename}, httpOptions)
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

    return Observable.throw(myreturn.label);
  }
}


// #############################################################################################

export interface ServerError {
  code: number;
  label: string;
}

export interface LoginResponseData {
  t: string;
  n: string;
  ws: string;
}

export interface BookletData {
  name: string;
  filename: string;
  title: string;
}

export interface BookletDataList {
  [code: string]: BookletData[];
}

export interface GetBookletsResponseData {
  mode: string;
  ws: string;
  booklets: {[code: string]: BookletData[]};
}

export interface GetBookletResponseData {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
}

