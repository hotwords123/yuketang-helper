import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import storage from './storage';
import * as API from "./api";
import { MyWebSocket, MyXMLHttpRequest } from './network';

const url = new URL(window.location.href);

if (url.pathname.startsWith("/lesson/fullscreen/v3/")) {
  launchLessonHelper();
} else if (url.pathname.startsWith("/v2/web/")) {
  pollActiveLessons();
}

function launchLessonHelper() {
  const app = createApp(App);
  app.mount(
    (() => {
      const app = document.createElement('div');
      document.body.append(app);
      return app;
    })(),
  );

  window.yktHelper = app;
}

function pollActiveLessons() {
  const enteredLessonIds = new Set();

  async function checkActiveLessons() {
    try {
      const resp = await API.getActiveLessons();
      if (resp.code !== 0)
        throw new Error(resp.msg);

      for (const lesson of resp.data.onLessonClassrooms) {
        const { classroomId, lessonId } = lesson;

        if (!enteredLessonIds.has(lessonId)) {
          window.open("https://pro.yuketang.cn/lesson/fullscreen/v3/" + lessonId, "_blank");
          enteredLessonIds.add(lessonId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  setInterval(checkActiveLessons, 5000);
}

window.WebSocket = MyWebSocket;
window.XMLHttpRequest = MyXMLHttpRequest;
window.yktStorage = storage;
window.yktAPI = API;

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
