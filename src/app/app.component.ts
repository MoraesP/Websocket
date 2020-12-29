import { Component, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { WebSocketApiService } from "./web-socket-api.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  message: string;
  topicSelected: string;

  messages = [];

  isConnect = false;

  topic1 = true;
  topic2 = true;
  topic3 = true;

  connection: Observable<any>;
  websocketStatusSubscription: Subscription;

  constructor(private webSocketApiService: WebSocketApiService) {}

  ngOnInit() {
    // this.connect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect() {
    this.webSocketApiService.initializeStatus();
    this.webSocketApiService.connect();
    this.subscribeWS();
  }

  disconnect() {
    this.webSocketApiService.disconnect();
    this.getStatusConnection();
    if (this.websocketStatusSubscription) {
      this.websocketStatusSubscription.unsubscribe();
    }
  }

  getStatusConnection() {
    this.isConnect = this.webSocketApiService.status.connection === 1;
  }

  subscribeWS() {
    this.websocketStatusSubscription = this.webSocketApiService.status$.subscribe(
      (_) => {}
    );
  }

  inscrever(topic: string) {
    this.connection = this.webSocketApiService.onMessage("/topic/" + topic);
    this.connection.subscribe((message) => {
      this.handleMessage(message);
    });
  }

  selectTopic(topic) {
    this.topicSelected = topic;
  }

  sendMessage() {
    this.webSocketApiService.send("/topic/" + this.topicSelected, this.message);
  }

  handleMessage(message) {
    this.messages.push(message);
  }
}
