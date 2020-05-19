import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {WebSocketMessage} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {filter, map, share} from 'rxjs/operators';


interface WsMessage {
  event: string;
  data: any;
}

@Injectable()
export class BackendService {

  private url = 'ws://127.0.0.1:3000';
  private connectionRetries = 5;
  private connectionRetried = 5;

  private webSocketSubject$: WebSocketSubject<any>;

  public serviceConnected$ = new BehaviorSubject<boolean>(undefined);


  constructor() {

    this.serviceConnected$
        .pipe(filter((value: boolean) => (value !== undefined)))
        .subscribe((status: boolean) => {

          if (status === false) {
            this.tryReconnect();
          }
        });
  }


  public connect(forceReconnect: boolean = false): WebSocketSubject<any> {


    // const url = 'wss://echo.websocket.org';

    if (!this.webSocketSubject$ || forceReconnect) {

      console.log('connecting...');

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

        url: this.url
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
        this.connect(true);
      }, 5000);
    }
  }


  public send(event: string, data: any) {

    if (!this.webSocketSubject$) {
      this.connect();
    }

    this.webSocketSubject$.next({event, data});
  }


  public observe<T>(subscriptionName: string): Observable<T> {

    if (!this.webSocketSubject$) {
      this.connect();
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
}
