import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'admin/php_superadmin/';
    }

  private errorHandler(error: Error | any): Observable<any> {
    return Observable.throw(error);
  }

  // *******************************************************************
  getUsers(token: string): Observable<GetUserDataResponse[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetUserDataResponse[]>(this.serverUrl + 'getUsers.php', {t: token}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }


  addUser(token: string, name: string, password: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'addUser.php', {t: token, n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  changePassword(token: string, name: string, password: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setPassword.php', {t: token, n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  deleteUsers(token: string, users: string[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'deleteUsers.php', {t: token, u: users}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getWorkspacesByUser(token: string, username: string): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getUserWorkspaces.php', {t: token, u: username}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  setWorkspacesByUser(token: string, user: string, accessTo: IdLabelSelectedData[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setUserWorkspaces.php', {t: token, u: user, w: accessTo}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  setAboutText(token: string): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/text'
      })
    };
    return this.http
    .post<string>(this.serverUrl + 'setAboutText.php', {t: token}, httpOptions).pipe(catchError(this.handleError));
  }

  // *******************************************************************
  // *******************************************************************
  addWorkspace(token: string, name: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'addWorkspace.php', {t: token, n: name}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  changeWorkspace(token: string, wsId: number, wsName: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setWorkspace.php', {t: token, ws_id: wsId, ws_name: wsName}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  deleteWorkspaces(token: string, workspaces: number[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'deleteWorkspaces.php', {t: token, ws: workspaces}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getUsersByWorkspace(token: string, workspaceId: number): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getWorkspaceUsers.php', {t: token, ws: workspaceId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  setUsersByWorkspace(token: string, workspace: number, accessing: IdLabelSelectedData[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setWorkspaceUsers.php', {t: token, w: workspace, u: accessing}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getWorkspaces(token: string): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getWorkspaces.php', {t: token}, httpOptions)
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
