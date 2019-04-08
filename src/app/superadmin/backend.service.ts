import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'php/sys.php/';
    }

  private errorHandler(error: Error | any): Observable<any> {
    return Observable.throw(error);
  }

  // *******************************************************************
  getUsers(): Observable<GetUserDataResponse[]> {
    return this.http
      .get<GetUserDataResponse[]>(this.serverUrl + 'users')
        .pipe(
          catchError(err => [])
        );
  }


  addUser(name: string, password: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/add', {n: name, p: password})
        .pipe(
          catchError(err => of(false))
        );
  }

  changePassword(name: string, password: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/pw', {n: name, p: password})
        .pipe(
          catchError(err => of(false))
        );
  }

  deleteUsers(users: string[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'users/delete', {u: users})
        .pipe(
          catchError(err => of(false))
        );
  }

  // *******************************************************************
  getWorkspacesByUser(username: string): Observable<IdRoleData[]> {
    return this.http
      .get<IdLabelSelectedData[]>(this.serverUrl + 'workspaces/' + username)
        .pipe(
          catchError(err => [])
        );
  }

  // *******************************************************************
  setWorkspacesByUser(user: string, accessTo: IdRoleData[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/workspaces', {u: user, ws: accessTo})
        .pipe(
          catchError(err => of(false))
        );
  }

  setAboutText(text: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/text'
      })
    };
    return this.http
    .post<string>(this.serverUrl + 'setAboutText.php', {text: text}, httpOptions).pipe(catchError(this.handleError));
  }

  // *******************************************************************
  // *******************************************************************
  addWorkspace(name: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'addWorkspace.php', {n: name}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  changeWorkspace(wsId: number, wsName: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setWorkspace.php', {ws_id: wsId, ws_name: wsName}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  deleteWorkspaces(workspaces: number[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'deleteWorkspaces.php', {ws: workspaces}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getUsersByWorkspace(workspaceId: number): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getWorkspaceUsers.php', {ws: workspaceId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  setUsersByWorkspace(workspace: number, accessing: IdLabelSelectedData[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setWorkspaceUsers.php', {w: workspace, u: accessing}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getWorkspaces(): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getWorkspaces.php', {}, httpOptions)
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


// / / / / / /
export interface ServerError {
  code: number;
  label: string;
}

export interface GetUserDataResponse {
  name: string;
}

export interface IdLabelSelectedData {
  id: number;
  label: string;
  selected: boolean;
}

export interface IdRoleData {
  id: number;
  label: string;
  role: string;
}
