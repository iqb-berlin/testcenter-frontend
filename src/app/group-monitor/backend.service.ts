import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BookletError, GroupData, TestSessionData } from './group-monitor.interfaces';
import { WebsocketBackendService } from '../shared/websocket-backend.service';
import { ApiError } from '../app.interfaces';

@Injectable()
export class BackendService extends WebsocketBackendService<TestSessionData[]> {
  public pollingEndpoint = '/monitor/test-sessions';
  public pollingInterval = 5000;
  public wsChannelName = 'test-sessions';
  public initialData: TestSessionData[] = [];

  public observeSessionsMonitor(): Observable<TestSessionData[]> {
    return this.observeEndpointAndChannel();
  }

  public getBooklet(bookletName: string): Observable<string|BookletError> {
    const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
    const missingFileError: BookletError = { error: 'missing-file', species: null };
    const generalError: BookletError = { error: 'general', species: null };

    return this.http
      .get(`${this.serverUrl}booklet/${bookletName}`, { headers, responseType: 'text' })
      .pipe(
        catchError((err: ApiError) => {
          if (err.code === 404) {
            // could potentially happen when booklet file was removed since test was started
            // TODO interceptor be omitted
            return of(missingFileError);
          }
          // TODO should interceptor should have interfered and moved to error-page ...
          // https://github.com/iqb-berlin/testcenter-frontend/issues/53
          return of(generalError);
        })
      );
  }

  public getGroupData(groupName: string): Observable<GroupData> {
    // TODO error-handling: interceptor should have interfered and moved to error-page ...
    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
    return this.http
      .get<GroupData>(`${this.serverUrl}monitor/group/${groupName}`)
      .pipe(catchError(() => of(<GroupData>{
        name: 'error',
        label: 'error'
      })));
  }

  public command(keyword: string, args: string[], testIds: number[]): Subscription {
    // TODO error-handling: interceptor should have interfered and moved to error-page ...
    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
    return this.http
      .put(
        `${this.serverUrl}monitor/command`,
        {
          keyword,
          arguments: args,
          timestamp: Date.now() / 1000,
          testIds
        }
      )
      .pipe(catchError(() => of(false)))
      .subscribe();
  }

  unlock(group_name: string, testIds: number[]): Subscription {
    // TODO interceptor should have interfered and moved to error-page ...
    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
    return this.http
      .post(`${this.serverUrl}monitor/group/${group_name}/tests/unlock`, { testIds })
      .pipe(catchError(() => of(false)))
      .subscribe();
  }

  lock(group_name: string, testIds: number[]): Subscription {
    // TODO interceptor should have interfered and moved to error-page ...
    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
    return this.http
      .post(`${this.serverUrl}monitor/group/${group_name}/tests/lock`, { testIds })
      .pipe(catchError(() => of(false)))
      .subscribe();
  }
}
