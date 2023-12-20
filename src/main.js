import { createApp } from 'vue';
import { GM_openInTab, unsafeWindow } from '$';
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
  createApp(App).mount(
    (() => {
      const app = document.createElement('div');
      document.body.append(app);
      return app;
    })(),
  );
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
          GM_openInTab("https://pro.yuketang.cn/lesson/fullscreen/v3/" + lessonId);
          enteredLessonIds.add(lessonId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  setInterval(checkActiveLessons, 5000);
}

unsafeWindow.WebSocket = MyWebSocket;
unsafeWindow.XMLHttpRequest = MyXMLHttpRequest;
unsafeWindow.yktStorage = storage;
unsafeWindow.yktAPI = API;
