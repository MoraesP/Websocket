import { Injectable } from "@angular/core";
import { Client, Message } from "@stomp/stompjs";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, first, switchMap } from "rxjs/operators";

export enum SocketClientState {
  ATTEMPTING,
  CONNECTED,
  DISCONNECT,
}

export class Topic {
  constructor(public id: string, public destination: string) {}
}

export interface WebsocketStatus {
  connection: SocketClientState;
  topics: Topic[];
}

@Injectable()
export class WebSocketApiService {
  topic: string = "/topic/greetings";
  webSocketEntPoint: string = "ws://localhost:8080/ws";

  private client: Client;
  private state: BehaviorSubject<SocketClientState>;

  status: WebsocketStatus;
  status$ = new Subject<WebsocketStatus>();

  static jsonHandler(message: Message): any {
    return message.body;
  }

  static textHandler(message: Message): string {
    return message.body;
  }

  initializeStatus() {
    this.status = {
      connection: SocketClientState.DISCONNECT,
      topics: [],
    };
    this.status$.next(this.status);
  }

  async connect() {
    this.state = new BehaviorSubject<SocketClientState>(
      SocketClientState.ATTEMPTING
    );
    this.status.connection = SocketClientState.ATTEMPTING;

    this.client = new Client({
      brokerURL: this.webSocketEntPoint,
      connectHeaders: { Authorization: "authorization" },
      onConnect: () => {
        this.state.next(SocketClientState.CONNECTED);
        this.status.connection = SocketClientState.CONNECTED;
        this.status.topics = [];
        this.status$.next(this.status);
      },
      onStompError: () => {
        this.errorConnectCallBack();
      },
      debug: (message) => {
        console.log(message);
      },
    });
    this.client.activate();
    console.log(this.state);
    console.log(this.status);
  }

  errorConnectCallBack() {
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  disconnect() {
    this.status.connection = SocketClientState.DISCONNECT;
    this.status.topics = [];
    this.getConnection()
      .pipe(first())
      .subscribe((client) => client.deactivate());
    console.log(this.state);
    console.log(this.status);
  }

  getConnection(): Observable<Client> {
    return new Observable<Client>((observer) => {
      this.state
        .pipe(filter((state) => state === SocketClientState.CONNECTED))
        .subscribe(() => {
          observer.next(this.client);
        });
    });
  }

  onMessage(
    topic: string,
    handler = WebSocketApiService.jsonHandler
  ): Observable<any> {
    return this.getConnection().pipe(
      first(),
      switchMap((client) => {
        return new Observable<any>((observer) => {
          const subscription = client.subscribe(topic, (message) => {
            observer.next(handler(message));
          });
          const topicStatus = new Topic(subscription.id, topic);
          this.status.topics.push(topicStatus);
          return () => client.unsubscribe(subscription.id);
        });
      })
    );
  }

  onPlainMessage(topic: string): Observable<string> {
    return this.onMessage(topic, WebSocketApiService.textHandler);
  }

  send(topic: string, message: string): void {
    this.getConnection()
      .pipe(first())
      .subscribe((inst) => inst.publish({ destination: topic, body: message }));
  }

  //   _connect(messageHandler: MessageHandler) {
  //     // console.log("Initialize WebSocket Connection");
  //     this._disconnect(messageHandler);
  //     let ws = new SockJS(this.webSocketEntPoint);
  //     messageHandler["stompClient"] = Stomp.over(ws);
  //     const _this = this;
  //     messageHandler["stompClient"].connect(
  //       { Authorization: "little-delicious-this-token" },
  //       function (_frame) {
  //         messageHandler["stompClient"].subscribe(
  //           _this.topic,
  //           function (sdkEvent) {
  //             _this.onMessageReceived(messageHandler, sdkEvent);
  //           }
  //         );
  //       },
  //       this.errorCallBack.bind(this, messageHandler)
  //     );
  //   }

  //   _disconnect(messageHandler: MessageHandler) {
  //     if (messageHandler["stompClient"]) {
  //       messageHandler["stompClient"].disconnect();
  //       messageHandler["stompClient"] = undefined;
  //     }

  //     console.log("Disconnected");
  //   }

  //   errorCallBack(messageHandler: MessageHandler) {
  //     setTimeout(() => {
  //       this._connect(messageHandler);
  //     }, 5000);
  //   }

  //   _send(messageHandler: MessageHandler, message) {
  //     console.log("calling logout api via web socket");
  //     messageHandler["stompClient"].send(
  //       "/app/hello",
  //       {},
  //       JSON.stringify(message)
  //     );
  //   }

  //   onMessageReceived(messageHandler: MessageHandler, message) {
  //     console.log("Message Received from Server -> ", message);
  //     messageHandler.handleMessage(JSON.stringify(message.body));
  //   }
}
