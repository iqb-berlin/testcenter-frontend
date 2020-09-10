import {Injectable} from '@angular/core';
import {Observable, of, Subscription} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {BookletError, GroupData, TestSession} from './group-monitor.interfaces';
import {WebsocketBackendService} from '../shared/websocket-backend.service';
import {HttpHeaders} from '@angular/common/http';
import {ApiError} from '../app.interfaces';

@Injectable()
export class BackendService extends WebsocketBackendService<TestSession[]> {
    public pollingEndpoint = '/monitor/test-sessions';
    public pollingInterval = 5000;
    public wsChannelName = 'test-sessions';
    public initialData: TestSession[] = [];

    public observeSessionsMonitor(): Observable<TestSession[]> {
        return this.observeEndpointAndChannel();
    }

    public getBooklet(bookletName: string): Observable<string|BookletError> {
        console.log('load booklet for ' + bookletName);

        const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');

        const missingFileError: BookletError = {error: 'missing-file'};
        const generalError: BookletError = {error: 'general'};

        return this.http
            .get(this.serverUrl + `booklet/${bookletName}`, {headers, responseType: 'text'})
            .pipe(
                catchError((err: ApiError) => {
                  console.warn(`getTestData Api-Error: ${err.code} ${err.info}`);
                  if (err.code === 404) {
                      // could potentially happen when booklet file was removed since test was started
                      // TODO interceptor be omitted
                      return of(missingFileError);
                  } else {
                      // TODO should interceptor should have interfered and moved to error-page ...
                      // https://github.com/iqb-berlin/testcenter-frontend/issues/53
                      return of(generalError);
                  }
                })
            );
    }

    public getGroupData(groupName: string): Observable<GroupData> {
        return this.http
            .get<GroupData>(this.serverUrl +  `monitor/group/${groupName}`)
            .pipe(catchError(() => {
                // TODO interceptor should have interfered and moved to error-page ...
                // https://github.com/iqb-berlin/testcenter-frontend/issues/53
                console.warn(`failed: monitor/group/${groupName}`);
                return of(<GroupData>{
                    name: 'error',
                    label: 'error',
                });
            }));
    }

    public command(keyword: string, args: string[], testIds: number[]): Subscription {
        console.log('SEND COMMAND: ' + keyword + ' ' + args.join(' ') + ' to ' + testIds.join(', '));
        return this.http
            .put(
                this.serverUrl +  `monitor/command`,
                {keyword, arguments: args, timestamp: Date.now() / 1000, testIds}
            )
            .pipe(
                catchError(() => {
                    // TODO interceptor should have interfered and moved to error-page ...
                    // https://github.com/iqb-berlin/testcenter-frontend/issues/53
                    console.warn(`failed: command`, keyword, args, testIds);
                    return of(false);
                })
            )
            .subscribe();
    }
}
