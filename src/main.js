import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
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
window.yktHelper = app;

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
