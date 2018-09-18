import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';





@Injectable()
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) { }


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
  startBookletByLoginToken(logintoken: string, code: string, bookletFilename: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string>(this.serverUrl +
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
  name: string;
  filename: string;
  title: string;
}

export interface BookletnamesByCode {
  [code: string]: string[];
}

export interface LoginData {
  mode: string;
  groupname: string;
  loginname: string;
  workspaceName: string;
  booklets: BookletData[];
  codeswithbooklets: BookletnamesByCode;
  code: string;
}

export interface BookletStatus {
  statusLabel: string;
  lastUnit: number;
  canStart: boolean;
  id: number;
  label: string;
}

export class PersonTokenAndBookletId {
  readonly personToken: string;
  readonly bookletId: number;
  constructor(serverreturn: string) {
    if ((typeof serverreturn !== 'string') || (serverreturn.length === 0)) {
      this.personToken = '';
      this.bookletId = 0;
    } else {
      const retSplits = serverreturn.split('##');
      this.personToken = retSplits[0];
      if (retSplits.length > 1) {
        this.bookletId = +retSplits[1];
      } else {
        this.bookletId = 0;
      }
    }
  }
}

