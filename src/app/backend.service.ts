
import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {
  LoginData,
  BookletStatus,
  PersonTokenAndTestId,
  SysConfig,
  SysCheckInfo,
  AuthData,
  WorkspaceData
} from './app.interfaces';
import {ErrorHandler, ServerError} from 'iqb-components';

// ============================================================================
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {}


  login(name: string, password: string): Observable<AuthData | number> {
    return this.http
        .put<AuthData>(this.serverUrl + 'session/admin', {name, password})
        .pipe(
          catchError(errCode => of(errCode)),
          switchMap(authData => {
            if (typeof authData === 'number') {
              const errCode = authData as number;
              if (errCode === 400) {
                return this.http
                  .put<LoginData>(this.serverUrl + 'session/login', {name, password})
                  .pipe(catchError(errCode => of(errCode)));
              } else {
                return of(errCode);
              }
            } else {
              return of(authData);
            }
          })
        );
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData> {
    return this.http
          .get<WorkspaceData>(this.serverUrl + 'workspace/' + workspaceId)
          .pipe(catchError(() => {
            console.warn('get workspace data failed for ' + workspaceId);
            return of(<WorkspaceData>{
              id: workspaceId,
              name: workspaceId,
              role: "n.d."
            })
          }));
  }

  getSessionData(): Observable<AuthData | number> {
    return this.http
      .get<AuthData>(this.serverUrl + 'session')
      .pipe(
        catchError(errCode => of(errCode))
      )
  }

  getSession(loginToken: string, personToken: string): Observable<LoginData | ServerError> {

    const authToken = JSON.stringify({l: loginToken, p: personToken});
    return this.http
      .get<LoginData>(this.serverUrl + 'session', {headers: {'AuthToken': authToken}})
      .pipe(catchError(ErrorHandler.handle));
  }


  getAdminSession(adminToken: string): Observable<LoginData | ServerError> {
    const authToken = JSON.stringify({at: adminToken});
    return this.http
      .get<LoginData>(this.serverUrl + 'session', {headers: {'AuthToken': authToken}})
      .pipe(catchError(ErrorHandler.handle));
  }


  getSysConfig(): Observable<SysConfig> {
    return this.http
      .get<SysConfig>(this.serverUrl + `system/config`)
      .pipe(catchError(() => of(null)))
  }

  public getSysCheckInfo(): Observable<SysCheckInfo[]> {
    return this.http
      .get<SysCheckInfo[]>(this.serverUrl + 'sys-checks')
      .pipe(
        catchError(() => {
          const myreturn: SysCheckInfo[] = [];
          return of(myreturn);
        })
      );
  }

  getBookletState(bookletName: string, code = ''): Observable<BookletStatus | ServerError> {

    // TODO after https://github.com/iqb-berlin/testcenter-iqb-ng/issues/52 is resolved,
    //  this must be removed, we would have a personToken here
    const params = new HttpParams().set('code', code);

    return this.http
      .get<BookletStatus>(this.serverUrl + `booklet/${bookletName}/state`, {params})
      .pipe(catchError(ErrorHandler.handle));
  }


  startBooklet(code: string, bookletName: string, bookletLabel: string): Observable<PersonTokenAndTestId | ServerError> {

    return this.http
      .put<PersonTokenAndTestId>(this.serverUrl + `test`, {code, bookletName, bookletLabel})
      .pipe(catchError(ErrorHandler.handle));
  }


  addBookletLogClose(testId: number): Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/log`, {timestamp: Date.now(), entry: 'BOOKLETLOCKEDbyTESTEE'})
      .pipe(catchError(ErrorHandler.handle));
  }


  lockBooklet(testId: number): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl + `test/${testId}/lock`, {})
      .pipe(catchError(ErrorHandler.handle));
  }
}
