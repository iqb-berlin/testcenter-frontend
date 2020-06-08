import {Inject, Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {WebSocketMessage} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {catchError, filter, map, share} from 'rxjs/operators';
import {ApiError, BookletData} from '../app.interfaces';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {StatusUpdate} from './group-monitor.interfaces';


interface WsMessage {
  event: string;
  data: any;
}

@Injectable()
export class BackendService {

  private url = 'ws://127.0.0.1:3000';
  private connectionRetries = 5;
  private connectionRetried = 5;

  private urlParam = "XYZ";

  private webSocketSubject$: WebSocketSubject<any>;

  public serviceConnected$ = new BehaviorSubject<boolean>(undefined);


  constructor(
      @Inject('SERVER_URL') private serverUrl: string,
      private http: HttpClient
  ) {

    this.serviceConnected$
        .pipe(filter((value: boolean) => (value !== undefined)))
        .subscribe((status: boolean) => {

          if (status === false) {
            this.tryReconnect();
          }
        });
  }


  public connect(urlParam: string, forceReconnect: boolean = false): WebSocketSubject<any> {

    this.urlParam = urlParam;

    // const url = 'wss://echo.websocket.org';

    if (!this.webSocketSubject$ || forceReconnect) {

      console.log('connecting...' + urlParam);

      this.webSocketSubject$ = webSocket({

        deserializer(event: MessageEvent): any {
          return JSON.parse(event.data);
        },

        serializer(value: any): WebSocketMessage {
          return JSON.stringify(value);
        },

        openObserver: {
          next: () => {
            console.log('connection established');
            this.serviceConnected$.next(true);
            this.connectionRetried = this.connectionRetries;
          }
        },

        url: this.url + '/' + urlParam
      });

      this.webSocketSubject$.subscribe(

          () => {},

          () => {
            console.log('connection error');
            this.serviceConnected$.next(false);
          },

          () => {
            console.log('connection closed');
            this.serviceConnected$.next(false);
          }
      );
    }

    return this.webSocketSubject$;
  }


  private tryReconnect() {

    if (this.connectionRetries-- ) {
      setTimeout(() => {
        console.log(`trying to reconnect (${this.connectionRetries} left)`);
        this.connect(this.urlParam, true);
      }, 5000);
    }
  }


  public send(event: string, data: any) {

    if (!this.webSocketSubject$) {
      this.connect(this.urlParam);
    }

    this.webSocketSubject$.next({event, data});
  }


  public observe<T>(subscriptionName: string): Observable<T> {

    if (!this.webSocketSubject$) {
      this.connect(this.urlParam);
    }

    return this.webSocketSubject$
        .multiplex(
          () => ({event: `subscribe:${subscriptionName}`}),
          () => ({event: `unsubscribe:${subscriptionName}`}),
          message => (message.event === subscriptionName)
      )
        .pipe(map((event: WsMessage): T => event.data))
        .pipe(share());
  }


  // === non websocket stuff -> TODO move to separate service

  getBooklet(bookletName: string): Observable<BookletData | boolean> {

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


  public sessions$: BehaviorSubject<StatusUpdate[]>;

  getSessions(): Observable<StatusUpdate[]> {

    console.log("load monitor for ");
    if (!this.sessions$) {

      this.sessions$ = new BehaviorSubject<StatusUpdate[]>([]);
    }

    const TODO_unsubscribME = this.http
        .get<StatusUpdate[]>(this.serverUrl + `/workspace/1/sessions`, {observe: 'response'})
        .subscribe((response: HttpResponse<StatusUpdate[]>) => {

            console.log("headers", response.headers);

            if (response.headers.has('SubscribeURI')) {

              console.log('use ws');
              this.urlParam = response.headers.get('SubscribeURI');
              this.observe<StatusUpdate[]>('status').subscribe(this.sessions$);
              // stand
              // - auf connection lost reagieren
              // - webserive aufräumen (abstralte ws-variante?)
              // - identification nutzen

            } else {

              this.sessions$.next(response.body);
              setTimeout(() => this.getSessions(), 5000);
            }
        });

    return this.sessions$;

        // .pipe(
        //     catchError((err: ApiError) => {
        //       console.warn(`getState Api-Error: ${err.code} ${err.info}`);
        //       return of(false)
        //     })
        // );
  }

}
