import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import storage from './storage';
import * as API from "./api";
import { MyWebSocket, MyXMLHttpRequest } from './network';

const app = createApp(App);
app.mount(
  (() => {
    const app = document.createElement('div');
    document.body.append(app);
    return app;
  })(),
);

window.WebSocket = MyWebSocket;
window.XMLHttpRequest = MyXMLHttpRequest;
window.yktStorage = storage;
window.yktAPI = API;
window.yktHelper = app;

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
