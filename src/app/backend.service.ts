
import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {LoginData, BookletStatus, PersonTokenAndTestId, KeyValuePair, SysConfig} from './app.interfaces';
import {ErrorHandler, ServerError} from 'iqb-components';

// ============================================================================
@Injectable()
export class BackendService {
  private serverSlimUrl = '';
  private serverSlimAdminUrl = '';
  private serverSlimUrl_Close = '';

  private serverUrl2 = 'http://localhost/testcenter-iqb-php/'; // TODO (BEFORE-MERGE) REMOVE

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {
      this.serverSlimUrl = this.serverUrl + 'php_tc/login.php/';
      this.serverSlimAdminUrl = this.serverUrl + 'admin/php/login.php/';
      this.serverSlimUrl_Close = this.serverUrl + 'php_tc/tc_post.php/';
      this.serverUrl = this.serverUrl + 'php_start/';
    }


  login(name: string, password: string): Observable<LoginData | ServerError> {

    return this.http
        .post<LoginData>(this.serverUrl2 + '/login/group', {name, password})
        .pipe(
          catchError(ErrorHandler.handle),
          switchMap(myLoginData => {
            if (myLoginData instanceof ServerError) {
              if ((myLoginData as ServerError).code === 401) {
                return this.http
                  .post<LoginData>(this.serverUrl2 + '/login/admin', {n: name, p: password})
                    .pipe(
                      catchError(ErrorHandler.handle)
                    );
              } else {
                return of(myLoginData);
              }
            } else {
              return of(myLoginData);
            }
          })
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

  getLoginDataAdmin(adminToken: string): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverSlimAdminUrl + 'login', {at: adminToken})
      .pipe(
        catchError(ErrorHandler.handle)
      );
  }


  getSysConfig(): Observable<KeyValuePair> {

    return this.http
      .get<SysConfig>(this.serverUrl2 + `system/config`)
      .pipe(catchError(() => of(null)))
      .pipe(map((sysConfig: SysConfig): KeyValuePair => {
        console.log(sysConfig.version); // check for system version missmatch https://github.com/iqb-berlin/testcenter-iqb-ng/issues/53
        return sysConfig.customTexts;
      }));
  }


  getBookletState(bookletName: string, code = ''): Observable<BookletStatus | ServerError> {

    const params = new HttpParams().set('code', code);

    return this.http
      .get<BookletStatus>(this.serverUrl2 + `booklet/${bookletName}/state`, {params})
      .pipe(catchError(ErrorHandler.handle));
  }


  startBooklet(code: string, bookletName: string, bookletLabel: string): Observable<PersonTokenAndTestId | ServerError> {

    return this.http
      .put<PersonTokenAndTestId>(this.serverUrl2 + `test`, {code, bookletName, bookletLabel})
      .pipe(catchError(ErrorHandler.handle));
  }


  addBookletLogClose(testId: number): Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/log`, {timestamp: Date.now(), entry: 'BOOKLETLOCKEDbyTESTEE'})
      .pipe(catchError(ErrorHandler.handle));
  }


  lockBooklet(testId: number): Observable<boolean | ServerError> {

    return this.http
      .post<boolean>(this.serverUrl2 + `test/${testId}/lock`, {})
      .pipe(catchError(ErrorHandler.handle));
  }
}
