import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {GroupData, TestSession} from './group-monitor.interfaces';
import {WebsocketBackendService} from './websocket-backend.service';
import {HttpHeaders} from '@angular/common/http';

@Injectable()
export class BackendService extends WebsocketBackendService<TestSession[]> {

    public pollingEndpoint = '/monitor/test-sessions';
    public pollingInterval = 5000;
    public wsChannelName = 'test-sessions';
    public initialData: TestSession[] = [];


    public subscribeSessionsMonitor(): Observable<TestSession[]> { // TODO rename since it does not return a subscription

        return this.subscribeEndpointAndChannel();
    }


    public getBooklet(bookletName: string): Observable<string> {

        console.log("load booklet for " + bookletName);

        const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');

        return this.http
            .get(this.serverUrl + `booklet/${bookletName}`, {headers, responseType: 'text'})
            // .pipe( // TODO useful error handling
            //     catchError((err: ApiError) => {
            //       console.warn(`getTestData Api-Error: ${err.code} ${err.info}`);
            //       return of(false)
            //     })
            // );
    }


    public getGroupData(groupName: string): Observable<GroupData> {
        return this.http
            .get<GroupData>(this.serverUrl +  `monitor/group/${groupName}`)
            .pipe(catchError(() => { // TODO useful error handling
                console.warn(`failed: monitor/group/${groupName}`);
                return of(<GroupData>{
                    name: groupName,
                    label: groupName,
                })
            }));
    }
}
