import {Injectable, Inject, SkipSelf} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    @SkipSelf() private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'php/sys.php/';
    }

  getUsers(): Observable<NameOnly[]> {
    return this.http
      .get<NameOnly[]>(this.serverUrl + 'users')
        .pipe(
          catchError(() => [])
        );
  }

  addUser(name: string, password: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/add', {n: name, p: password})
        .pipe(
          catchError(() => of(false))
        );
  }

  changePassword(name: string, password: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/pw', {n: name, p: password})
        .pipe(
          catchError(() => of(false))
        );
  }

  deleteUsers(users: string[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'users/delete', {u: users})
        .pipe(
          catchError(() => of(false))
        );
  }

  getWorkspacesByUser(username: string): Observable<IdRoleData[]> {
    return this.http
      .get<IdLabelSelectedData[]>(this.serverUrl + 'workspaces?u=' + username)
        .pipe(
          catchError(() => [])
        );
  }

  setWorkspacesByUser(user: string, accessTo: IdRoleData[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'user/workspaces', {u: user, ws: accessTo})
        .pipe(
          catchError(() => of(false))
        );
  }

  addWorkspace(name: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/add', {n: name})
        .pipe(
          catchError(() => of(false))
        );
  }

  renameWorkspace(wsId: number, wsName: string): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/rename', {ws: wsId, n: wsName})
        .pipe(
          catchError(() => of(false))
        );
  }

  deleteWorkspaces(workspaces: number[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspaces/delete', {ws: workspaces})
        .pipe(
          catchError(() => of(false))
        );
  }

  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {
    return this.http
      .get<IdRoleData[]>(this.serverUrl + 'users?ws=' + workspaceId)
        .pipe(
          catchError(() => [])
        );
  }

  setUsersByWorkspace(workspace: number, accessing: IdRoleData[]): Observable<Boolean> {
    return this.http
      .post<Boolean>(this.serverUrl + 'workspace/users', {ws: workspace, u: accessing})
        .pipe(
          catchError(() => of(false))
        );
  }

  getWorkspaces(): Observable<IdAndName[]> {
    return this.http
      .get<IdAndName[]>(this.serverUrl + 'workspaces')
        .pipe(
          catchError(() => [])
        );
  }
}


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
