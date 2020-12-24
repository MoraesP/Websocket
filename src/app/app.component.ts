import { Component, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { WebSocketApiService } from "./web-socket-api.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "websocket-front";

  name: string;
  user: "pedro";

  connection: Observable<any>;
  websocketStatusSubscription: Subscription;

  constructor(private webSocketApiService: WebSocketApiService) {}

  ngOnInit() {
    // this.connect();
  }

  ngOnDestroy(): void {
    this.webSocketApiService.disconnect();
    if (this.websocketStatusSubscription) {
      this.websocketStatusSubscription.unsubscribe();
    }
  }

  connect() {
    this.webSocketApiService.initializeStatus();
    this.webSocketApiService.connect();
    this.subscribeWS();
  }

  disconnect() {
    this.webSocketApiService.disconnect();
  }

  subscribeWS() {
    this.websocketStatusSubscription = this.webSocketApiService.status$.subscribe(
      (_) => {
        this.connection = this.webSocketApiService.onMessage(
          "/topic/greetings"
        );
        this.connection.subscribe((message) => {
          this.handleMessage(message);
        });
      }
    );
  }

  sendMessage() {
    this.webSocketApiService.send("/topic/greetings", this.name);
  }

  handleMessage(message) {
    console.log(message);
  }
}
