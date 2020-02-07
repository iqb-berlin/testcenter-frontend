
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginData, BookletStatus, PersonTokenAndBookletDbId, KeyValuePair } from './app.interfaces';
import {ErrorHandler, ServerError} from "iqb-components";

// ============================================================================
@Injectable()
export class BackendService {
  private serverSlimUrl = '';
  private serverSlimUrl_Close = '';

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
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
  getSysConfig(): Observable<KeyValuePair> {
    return this.http.get<KeyValuePair>(this.serverSlimUrl + 'sysconfig')
        .pipe(
          catchError(() => of(null))
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
      .post<boolean>(this.serverSlimUrl_Close + 'log', {b: bookletDbId, t: Date.now(), e: 'BOOKLETLOCKEDbyTESTEE'})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  lockBooklet(bookletDbId: number): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverSlimUrl_Close + 'lock', {b: bookletDbId})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }
}
