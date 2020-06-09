import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, share} from 'rxjs/operators';
import {WebSocketMessage} from 'rxjs/internal/observable/dom/WebSocketSubject';

interface WsMessage {
  event: string;
  data: any;
}

export class WebsocketService {

  protected url = 'ws://127.0.0.1:3000';
  protected urlParam = "XYZ";

  private webSocketSubject$: WebSocketSubject<any>;

  public serviceConnected$ = new BehaviorSubject<boolean>(null);


  constructor(
  ) {
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


  public send(event: string, data: any) {

    if (!this.webSocketSubject$) {
      this.connect(this.urlParam);
    }

    this.webSocketSubject$.next({event, data});
  }


  public getChannel<T>(channelName: string): Observable<T> {

    if (!this.webSocketSubject$) {
      this.connect(this.urlParam);
    }

    return this.webSocketSubject$
        .multiplex(
            () => ({event: `subscribe:${channelName}`}),
            () => ({event: `unsubscribe:${channelName}`}),
            message => (message.event === channelName)
        )
        .pipe(map((event: WsMessage): T => event.data))
        .pipe(share());
  }
}
