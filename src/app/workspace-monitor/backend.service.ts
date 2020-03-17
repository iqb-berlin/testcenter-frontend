import { BookletsStarted, MonitorData } from './workspace-monitor.interfaces';
import {Injectable, Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';

@Injectable()

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

  getBookletsStarted(ws: number, groups: string[]): Observable<BookletsStarted[] | ServerError> {
    return this.http
      .post<BookletsStarted[]>(this.serverUrl + 'getBookletsStarted.php', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  lockBooklets(ws: number, groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSlim + 'lock', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  unlockBooklets(ws: number, groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSlim + 'unlock', {g: groups})
        .pipe(
            catchError(ErrorHandler.handle)
          );
}

  getMonitorData(ws: number): Observable<MonitorData[] | ServerError> {
    return this.http
      .post<MonitorData[]>(this.serverUrl + 'getMonitorData.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }
}
