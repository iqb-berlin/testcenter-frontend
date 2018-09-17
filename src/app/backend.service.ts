import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  login(name: string, password: string): Observable<string | ServerError> {
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

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  // don't use LoginData.code!
  getLoginDataByLoginToken(logintoken: string): Observable<LoginData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LoginData>(this.serverUrl + 'getLoginDataByLoginToken.php', {lt: logintoken}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

   // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
   getLoginDataByPersonToken(persontoken: string): Observable<LoginData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LoginData>(this.serverUrl + 'getLoginDataByPersonToken.php', {lt: persontoken}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  getBookletStatusByNameAndPersonToken(persontoken: string, bookletname: string): Observable<BookletStatus | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletStatus>(this.serverUrl + 'getBookletStatusByNameAndPersonToken.php', {
        pt: persontoken, b: bookletname}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  getBookletStatusByNameAndLoginToken(logintoken: string, code: string, bookletname: string): Observable<BookletStatus | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletStatus>(this.serverUrl + 'getBookletStatusByNameAndLoginToken.php', {
        lt: logintoken, b: bookletname, c: code}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  getBookletStatusByDbId(persontoken: string, bookletid: number): Observable<BookletStatus | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletStatus>(this.serverUrl + 'getBookletStatusByDbId.php', {
        pt: persontoken, b: bookletid}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  startBookletByLoginToken(logintoken: string, code: string, bookletFilename: string): Observable<PersonTokenAndBookletId | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<PersonTokenAndBookletId>(this.serverUrl +
            'startBookletByLoginToken.php', {lt: logintoken, c: code, b: bookletFilename}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  startBookletByPersonToken(persontoken: string, bookletFilename: string): Observable<number | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<number>(this.serverUrl + 'startBookletByPersonToken.php', {pt: persontoken, b: bookletFilename}, httpOptions)
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
}


// #############################################################################################

// class to be able to use instanceof to check type
export class ServerError {
  public code: number;
  public label: string;
  constructor(code: number, label: string) {
    this.code = code;
    this.label = label;
  }
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

export interface LoginData {
  mode: string;
  groupname: string;
  loginname: string;
  workspaceName: string;
  booklets: BookletDataList;
  code: string;
}

export interface BookletStatus {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
  id: number;
  label: string;
  name: string;
}

export interface PersonTokenAndBookletId {
  personToken: string;
  bookletId: number;
}

