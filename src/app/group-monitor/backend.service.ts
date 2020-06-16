import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ApiError, BookletData} from '../app.interfaces';
import {TestSession} from './group-monitor.interfaces';
import {WebsocketBackendService} from './websocket-backend.service';

@Injectable()
export class BackendService extends WebsocketBackendService<TestSession[]> {

    public pollingEndpoint = '/monitor/test-sessions';
    public pollingInterval = 5000;
    public wsChannelName = 'test-sessions';
    public initialData: TestSession[] = [];


    public subscribeSessionsMonitor(): Observable<TestSession[]> { // TODO rename since it does not return a subscription

        return this.subscribeEndpointAndChannel();
    }


    public getBooklet(bookletName: string): Observable<BookletData | boolean> {

        console.log("load booklet for " + bookletName);

        return this.http
            .get<BookletData>(this.serverUrl + `booklet/${bookletName}/data`)
            .pipe(
                catchError((err: ApiError) => {
                  console.warn(`getTestData Api-Error: ${err.code} ${err.info}`);
                  return of(false)
                })
            );
    }
}
