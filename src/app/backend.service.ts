
import { Injectable, Inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
    SysCheckInfo,
    AuthData,
    WorkspaceData,
    BookletData, ApiError, AccessObject
} from './app.interfaces';
import {SysConfig} from "./config/app.config";

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
          catchError((err: ApiError) => {
            console.warn(`login Api-Error: ${err.code} ${err.info} `);
            return of(err.code)
          }),
          switchMap(authData => {
            if (typeof authData === 'number') {
              const errCode = authData as number;
              if (errCode === 400) {
                return this.http
                  .put<AuthData>(this.serverUrl + 'session/login', {name, password})
                  .pipe(catchError((err: ApiError) => of(err.code)));
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
        catchError((err: ApiError) => {
          console.warn(`nameOnlyLogin Api-Error: ${err.code} ${err.info} `);
          return of(err.code)
        })
      );
  }

  codeLogin(code: string): Observable<AuthData | number> {
    return this.http
      .put<AuthData>(this.serverUrl + 'session/person', {code})
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`codeLogin Api-Error: ${err.code} ${err.info} `);
          return of(err.code)
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

    getGroupData(groupName: string): Observable<AccessObject> {

        interface NameAndLabel { // TODO find consistent terminology. in XSD they are called name & label and likewise (mostly) in newer BE-versions
            name: string;
            label: string;
        }

        return this.http
            .get<NameAndLabel>(this.serverUrl + 'monitor/group/' + groupName)
            .pipe(map((r: NameAndLabel): AccessObject => ({id: r.name, name: r.label})))
            .pipe(catchError(() => {
                console.warn('get group data failed for ' + groupName);
                return of(<AccessObject>{
                    id: groupName,
                    name: groupName,
                })
            }));
    }

  getSessionData(): Observable<AuthData | number> {
    return this.http
      .get<AuthData>(this.serverUrl + 'session')
      .pipe(
        catchError((err: ApiError) => of(err.code))
      )
  }

  getBookletData(bookletId: string): Observable<BookletData> {
    return this.http
      .get<BookletData>(this.serverUrl + 'booklet/' + bookletId + '/data')
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
        catchError((err: ApiError) => of(err.code))
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
