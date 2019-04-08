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
  getUsers(): Observable<NameOnly[]> {
    return this.http
      .get<NameOnly[]>(this.serverUrl + 'users')
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
      .get<IdLabelSelectedData[]>(this.serverUrl + 'workspaces?u=' + username)
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

  // *******************************************************************
  // *******************************************************************
  addWorkspace(name: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/add', {n: name})
        .pipe(
          catchError(err => of(false))
        );
  }

  // *******************************************************************
  renameWorkspace(wsId: number, wsName: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/rename', {ws: wsId, n: wsName})
        .pipe(
          catchError(err => of(false))
        );
  }

  // *******************************************************************
  deleteWorkspaces(workspaces: number[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspaces/delete', {ws: workspaces})
        .pipe(
          catchError(err => of(false))
        );
  }

  // *******************************************************************
  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdRoleData[]>(this.serverUrl + 'users?ws=' + workspaceId)
        .pipe(
          catchError(err => [])
        );
  }

  // *******************************************************************
  setUsersByWorkspace(workspace: number, accessing: IdRoleData[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/users', {ws: workspace, u: accessing})
        .pipe(
          catchError(err => of(false))
        );
  }

  // *******************************************************************
  getWorkspaces(): Observable<IdAndName[]> {
    return this.http
      .get<IdAndName[]>(this.serverUrl + 'workspaces')
        .pipe(
          catchError(err => [])
        );
  }
}


// / / / / / /
export interface NameOnly {
  name: string;
}

export interface IdAndName {
  id: number;
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
