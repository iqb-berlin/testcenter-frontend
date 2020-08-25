import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {map, share} from 'rxjs/operators';
import {WebSocketMessage} from 'rxjs/internal/observable/dom/WebSocketSubject';

interface WsMessage {
  event: string;
  data: any;
}

export class WebsocketService {
  protected wsUrl = '';
  private wsSubject$: WebSocketSubject<any>;
  public wsConnected$ = new BehaviorSubject<boolean>(null);
  private wsSubscription: Subscription;

  constructor(
  ) {
  }

  public connect() {
    if (!this.wsSubject$) {

      console.log('connecting...' + this.wsUrl);

      this.wsSubject$ = webSocket({

        deserializer(event: MessageEvent): any {
          return JSON.parse(event.data);
        },

        serializer(value: any): WebSocketMessage {
          return JSON.stringify(value);
        },

        openObserver: {
          next: () => {
            console.log('connection established');
            this.wsConnected$.next(true);
          }
        },

        url: this.wsUrl
      });

      this.wsSubscription = this.wsSubject$.subscribe(

          () => {},

          () => {
            console.error('connection error');
            this.closeConnection();
          },

          () => {
            console.log('connection closed');
            this.closeConnection();
          }
      );
    }
  }

  protected closeConnection(): void {
    this.wsConnected$.next(false);
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.wsSubject$) {
      this.wsSubject$.complete();
      this.wsSubject$ = null;
    }
  }

  public send(event: string, data: any) {
    if (!this.wsSubject$) {
      this.connect();
    }

    this.wsSubject$.next({event, data});
  }

  public getChannel<T>(channelName: string): Observable<T> {
    if (!this.wsSubject$) {
        this.connect();
    }

    return this.wsSubject$
        .multiplex(
            () => ({event: `subscribe:${channelName}`}),
            () => ({event: `unsubscribe:${channelName}`}),
            message => (message.event === channelName)
        )
        .pipe(map((event: WsMessage): T => event.data))
        .pipe(share());
  }
}
