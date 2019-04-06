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
  getUsers(): Observable<GetUserDataResponse[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetUserDataResponse[]>(this.serverUrl + 'getUsers.php', {}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }


  addUser(name: string, password: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'addUser.php', {n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  changePassword(name: string, password: string): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setPassword.php', {n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  deleteUsers(users: string[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'deleteUsers.php', {u: users}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getWorkspacesByUser(username: string): Observable<IdLabelSelectedData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<IdLabelSelectedData[]>(this.serverUrl + 'getUserWorkspaces.php', {u: username}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  setWorkspacesByUser(user: string, accessTo: IdLabelSelectedData[]): Observable<Boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<Boolean>(this.serverUrl + 'setUserWorkspaces.php', {u: user, w: accessTo}, httpOptions)
        .pipe(
          catchError(this.handleError)
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
