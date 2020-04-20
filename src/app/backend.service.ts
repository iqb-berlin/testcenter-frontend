
import { Injectable, Inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
  SysConfig,
  SysCheckInfo,
  AuthData,
  WorkspaceData,
  BookletData, MonitorScopeData
} from './app.interfaces';

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
    if (password) {
      return this.http
        .put<AuthData>(this.serverUrl + 'session/admin', {name, password})
        .pipe(
          catchError(errCode => of(errCode)),
          switchMap(authData => {
            if (typeof authData === 'number') {
              const errCode = authData as number;
              if (errCode === 400) {
                return this.http
                  .put<AuthData>(this.serverUrl + 'session/login', {name, password})
                  .pipe(catchError(errCode => of(errCode)));
              } else {
                return of(errCode);
              }
            } else {
              return of(authData);
            }
          })
        );
    } else {
      return this.nameOnlyLogin(name);
    }
  }

  nameOnlyLogin(name: string): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(this.serverUrl + 'session/login', {name})
      .pipe(
        catchError(errCode => of(errCode))
      );
  }

  codeLogin(code: string): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(this.serverUrl + 'session/person', {code})
      .pipe(
        catchError(errCode => of(errCode))
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

  getMonitorScopeData(monitorScopeId: string): Observable<MonitorScopeData> {
    return this.http
      .get<MonitorScopeData>(this.serverUrl + 'monitorscope/' + monitorScopeId) // TODO fix route
      .pipe(catchError(() => {
        console.warn('get monitor scope data failed for ' + monitorScopeId);
        return of(<MonitorScopeData>{
          id: monitorScopeId,
          name: monitorScopeId,
          type: "n.d."
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

  getBookletData(bookletId: string): Observable<BookletData> {
    return this.http
      .get<BookletData>(this.serverUrl + 'booklet/' + bookletId)
      .pipe(
        map(bData => {
          bData.id = bookletId;
          return bData
        }),
        catchError(() => {
        console.warn('get booklet data failed for ' + bookletId);
        return of(<BookletData>{
          id: bookletId,
          label: bookletId,
          locked: true,
          running: false
        })
      }));
  }

  startTest(bookletName: string): Observable<string | number> {
    return this.http
      .put<number>(this.serverUrl + 'test', {bookletName})
      .pipe(
        map((testId: number) => String(testId)),
        catchError(errCode => of(errCode))
      );
  }

  getSysConfig(): Observable<SysConfig> {
    return this.http
      .get<SysConfig>(this.serverUrl + `system/config`)
      .pipe(catchError(() => of(null)))
  }

  getSysCheckInfo(): Observable<SysCheckInfo[]> {
    return this.http
      .get<SysCheckInfo[]>(this.serverUrl + 'sys-checks')
      .pipe(
        catchError(() => {
          return of([]);
        })
      );
  }
}
