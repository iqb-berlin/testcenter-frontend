import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ErrorHandler, ServerError } from 'iqb-components';
import { BookletsStarted, MonitorData } from './workspace-monitor.interfaces';

@Injectable({
  providedIn: 'root'
})

export class BackendService {
  private serverUrlSlim = '';
  private serverUrlSysCheck = '';

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {
    this.serverUrlSlim = this.serverUrl + 'php/ws.php/';
    this.serverUrlSysCheck = this.serverUrl + 'php_admin/';
    this.serverUrl = this.serverUrl + 'php/';
  }

  getBookletsStarted(workspaceId: number, groups: string[])
    : Observable<BookletsStarted[] | ServerError> {
    return this.http
      .get<BookletsStarted[]>(this.serverUrl + `workspace/${workspaceId}/booklets/started`, {params: {groups: groups.join(',')}})
      .pipe(catchError(ErrorHandler.handle));
  }

  lockBooklets(workspaceId: number, groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .patch<boolean>(this.serverUrl + `workspace/${workspaceId}/tests/lock`, {groups: groups})
      .pipe(catchError(ErrorHandler.handle));
  }

  unlockBooklets(workspaceId: number, groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .patch<boolean>(this.serverUrl + `workspace/${workspaceId}/tests/unlock`, {groups: groups})
      .pipe(catchError(ErrorHandler.handle));
  }


  getMonitorData(workspaceId: number): Observable<MonitorData[] | ServerError> {
    return this.http
      .get<MonitorData[]>(this.serverUrl + `workspace/${workspaceId}/status`, {})
      .pipe(catchError(ErrorHandler.handle));
  }
}
