import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginData, BookletStatus, PersonTokenAndBookletDbId, BookletData, BookletDataListByCode } from './app.interfaces';

// ============================================================================
// class instead of interface to be able to use instanceof to check type
export class ServerError {
  public code: number;
  public labelNice: string;
  public labelSystem: string;
  constructor(code: number, labelNice: string, labelSystem: string) {
    this.code = code;
    this.labelNice = labelNice;
    this.labelSystem = labelSystem;
  }
}

// ============================================================================
export class ErrorHandler {
  public static handle(errorObj: HttpErrorResponse): Observable<ServerError> {
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

// ============================================================================
@Injectable()
export class BackendService {
  private serverSlimUrl = '';
  private serverSlimUrl_Close = '';

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverSlimUrl = this.serverUrl + 'php_tc/login.php/';
      this.serverSlimUrl_Close = this.serverUrl + 'php_tc/tc_post.php/';
      this.serverUrl = this.serverUrl + 'php_start/';
    }


  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  login(name: string, password: string): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverSlimUrl + 'login', {n: name, p: password})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  getLoginData(loginToken: string, personToken: string, bookletDbId: number): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverSlimUrl + 'login', {lt: loginToken, pt: personToken, b: bookletDbId})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  getBookletStatus(bookletid: string, code = ''): Observable<BookletStatus | ServerError> {
    let urlString = '?b=' + bookletid;
    if (code.length > 0) {
      urlString += '&c=' + code;
    }

    return this.http.get<BookletStatus>(this.serverSlimUrl + 'bookletstatus' + urlString)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  startBooklet(code: string, bookletid: string, bookletLabel: string): Observable<PersonTokenAndBookletDbId | ServerError> {
    return this.http
      .post<PersonTokenAndBookletDbId>(this.serverSlimUrl + 'startbooklet', {c: code, b: bookletid, bl: bookletLabel})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  addBookletLogClose(bookletDbId: number): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_Close + 'log', {b: bookletDbId, t: Date.now(), e: 'BOOKLETCLOSED'})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  setBookletState(bookletDbId: number): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_Close + 'state', {b: bookletDbId, sk: 'BOOKLETCLOSED', s: 'Y'})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }
}
