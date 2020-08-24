import {Inject, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {catchError, map, skipWhile, tap} from 'rxjs/operators';
import {ApiError} from '../app.interfaces';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {WebsocketService} from './websocket.service';

export type ConnectionStatus = 'initial' | 'ws-offline' | 'ws-online' | 'polling-sleep' | 'polling-fetch' | 'error';

export abstract class WebsocketBackendService<T> extends WebsocketService implements OnDestroy {
  protected abstract pollingEndpoint: string;
  protected abstract pollingInterval: number;
  protected abstract wsChannelName: string;
  protected abstract initialData: T;

  public data$: BehaviorSubject<T>;
  public connectionStatus$: BehaviorSubject<ConnectionStatus> = new BehaviorSubject<ConnectionStatus>('initial');

  private wsConnectionStatusSubscription: Subscription = null;
  private wsDataSubscription: Subscription = null;
  private pollingTimeoutId: number = null;

  protected connectionClosed = true;

  constructor(
      @Inject('SERVER_URL') protected serverUrl: string,
      protected http: HttpClient
  ) {
    super();

  }

  ngOnDestroy(): void {
    this.cutConnection();
  }

  protected observeEndpointAndChannel(): Observable<T> {
    if (!this.data$) {

        this.data$ = new BehaviorSubject<T>(this.initialData);
        this.pollNext();
    }
    return this.data$;
  }

  private pollNext(): void {
    this.connectionClosed = false;

    this.unsubscribeFromWebsocket();

    this.connectionStatus$.next('polling-fetch');

    this.http
        .get<T>(this.serverUrl + this.pollingEndpoint, {observe: 'response'})
        .pipe(
            // TODO interceptor should have interfered and moved to error-page https://github.com/iqb-berlin/testcenter-frontend/issues/53
            catchError((err: ApiError) => {
                console.warn(`Api-Error: ${err.code} ${err.info}`);
                this.connectionStatus$.next('error');
                return new Observable<T>();
            })
        )
        .subscribe((response: HttpResponse<T>) => {

            this.data$.next(response.body);

            if (response.headers.has('SubscribeURI')) {

                this.wsUrl = response.headers.get('SubscribeURI');
                console.log('switch to websocket-mode');
                this.subScribeToWsChannel();

            } else {

                this.connectionStatus$.next('polling-sleep');
                this.scheduleNextPoll();
            }
        });
  }

  public cutConnection(): void {
    console.log('cut monitor connection');

    this.unsubscribeFromWebsocket();
    this.closeConnection();

    if (this.pollingTimeoutId) {
        clearTimeout(this.pollingTimeoutId);
        this.pollingTimeoutId = null;
    }

    this.data$ = null;
  }

  private scheduleNextPoll(): void {
    if (this.pollingTimeoutId) {
        clearTimeout(this.pollingTimeoutId);
    }

    this.pollingTimeoutId = window.setTimeout(
        () => {if (!this.connectionClosed) { this.pollNext(); }},
        this.pollingInterval
    );
  }

  private unsubscribeFromWebsocket() {
    if (this.wsConnectionStatusSubscription) {
        this.wsConnectionStatusSubscription.unsubscribe();
    }

    if (this.wsDataSubscription) {
        this.wsDataSubscription.unsubscribe();
    }
  }

  private subScribeToWsChannel() {
    this.wsDataSubscription = this.getChannel<T>(this.wsChannelName)
        .subscribe((dataObject: T) => this.data$.next(dataObject)); // subscribe only next, not complete!

    this.wsConnectionStatusSubscription = this.wsConnected$
        .pipe(
            skipWhile((item: boolean) => item === null), // skip pre-init-state
            tap((wsConnected: boolean) => {
              if (!wsConnected) {
                console.log('switch to polling-mode');
                this.scheduleNextPoll();
              }
            }),
            map((wsConnected: boolean): ConnectionStatus => wsConnected ? 'ws-online' : 'ws-offline')
        )
        .subscribe(this.connectionStatus$);
  }
}
