import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})

export class BackendService {

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {
  }

  getUsers(): Observable<IdAndName[]> {

    return this.http
      .get<NameOnly[]>(this.serverUrl + 'users')
      .pipe(catchError(() => []));
  }

  addUser(name: string, password: string): Observable<Boolean> {

    return this.http
      .put<Boolean>(this.serverUrl + 'user', {n: name, p: password})
      .pipe(catchError(() => of(false)));
  }

  changePassword(userId: number, password: string): Observable<Boolean> {

    return this.http
      .patch<Boolean>(this.serverUrl + `user/${userId}/password`, {p: password})
      .pipe(catchError(() => of(false)));
  }

  deleteUsers(users: string[]): Observable<Boolean> {

    return this.http
      .request<boolean>('delete', this.serverUrl + 'users', {body: {u: users}})
      .pipe(catchError(() => of(false)));
  }

  getWorkspacesByUser(userId: number): Observable<IdRoleData[]> {

    return this.http
      .get<IdLabelSelectedData[]>(this.serverUrl + `user/${userId}/workspaces`)
      .pipe(catchError(() => []));
  }

  setWorkspacesByUser(userId: number, accessTo: IdRoleData[]): Observable<Boolean> {

    return this.http
      .patch<Boolean>(this.serverUrl + `user/${userId}/workspaces`, {ws: accessTo})
      .pipe(catchError(() => of(false)));
  }

  addWorkspace(name: string): Observable<Boolean> {

    return this.http
      .put<Boolean>(this.serverUrl + 'workspace', {name: name})
      .pipe(catchError(() => of(false)));
  }

  renameWorkspace(workspaceId: number, wsName: string): Observable<Boolean> {

    return this.http
      .patch<Boolean>(this.serverUrl + `workspace/${workspaceId}`, {name: wsName})
      .pipe(catchError(() => of(false)));
  }

  deleteWorkspaces(workspaces: number[]): Observable<Boolean> {

    return this.http
      .request<Boolean>('delete', this.serverUrl + 'workspaces', {body: {ws: workspaces}})
      .pipe(catchError(() => of(false)));
  }

  getUsersByWorkspace(workspaceId: number): Observable<IdRoleData[]> {

    return this.http
      .get<IdRoleData[]>(this.serverUrl + `workspace/${workspaceId}/users`)
      .pipe(catchError(() => []));
  }

  setUsersByWorkspace(workspaceId: number, accessing: IdRoleData[]): Observable<Boolean> {

    return this.http
      .patch<Boolean>(this.serverUrl + `workspace/${workspaceId}/users`, {u: accessing})
      .pipe(catchError(() => of(false)));
  }

  getWorkspaces(): Observable<IdAndName[]> {

    return this.http
      .get<IdAndName[]>(this.serverUrl + 'workspaces')
      .pipe(catchError(() => []));
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
