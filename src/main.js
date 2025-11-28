import { createApp } from "vue";
import {
  GM_openInTab,
  GM_getTab,
  GM_saveTab,
  GM_getTabs,
  monkeyWindow,
  unsafeWindow,
} from "$";
import "./style.css";
import App from "./App.vue";
import storage from "./storage";
import * as API from "./api";
import { MyWebSocket, MyXMLHttpRequest } from "./network";

// #region Lesson helper
if (window.location.pathname.startsWith("/lesson/fullscreen/v3/")) {
  launchLessonHelper();
}

function launchLessonHelper() {
  GM_getTab((tab) => {
    tab.type = "lesson";
    tab.lessonId = window.location.pathname.split("/")[4];
    GM_saveTab(tab);
  });

  const run = () => {
    const el = document.createElement("div");
    document.body.append(el);
    createApp(App).mount(el);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
}
// #endregion

// #region Poll active lessons
function pollActiveLessons() {
  const enteredLessonIds = new Set();

  function updateLessonIds() {
    return new Promise((resolve) => {
      GM_getTabs((tabs) => {
        for (const key in tabs) {
          const tab = tabs[key];
          if (tab.type === "lesson") {
            enteredLessonIds.add(tab.lessonId);
          }
        }
        resolve();
      });
    });
  }

  async function checkActiveLessons() {
    const resp = await API.getActiveLessons();
    if (resp.code !== 0) {
      throw new Error("Failed to get active lessons: " + resp.msg);
    }

    for (const lesson of resp.data.onLessonClassrooms) {
      const { classroomId, lessonId } = lesson;

      if (!enteredLessonIds.has(lessonId)) {
        const url = new URL(
          `/lesson/fullscreen/v3/${lessonId}`,
          location.origin
        );
        GM_openInTab(url.href, { active: false });
        enteredLessonIds.add(lessonId);
      }
    }
  }

  updateLessonIds();

  const handle = setInterval(async () => {
    await updateLessonIds();
    await checkActiveLessons();
  }, 5000);

  return () => {
    clearInterval(handle);
    enteredLessonIds.clear();
  };
}

let stopPollingLessons = null;

function handleUrlChange(url) {
  const POLLING_PROMPT = " [自动进入课堂]";

  const parsed = new URL(url);
  const shouldPoll = parsed.pathname === "/v2/web/index";

  if (shouldPoll && stopPollingLessons === null) {
    console.log("[yuketang-helper] Start polling active lessons");
    stopPollingLessons = pollActiveLessons();
    document.title += POLLING_PROMPT;
  } else if (!shouldPoll && stopPollingLessons !== null) {
    console.log("[yuketang-helper] Stop polling active lessons");
    stopPollingLessons();
    stopPollingLessons = null;
    document.title = document.title.replace(POLLING_PROMPT, "");
  }
}

handleUrlChange(window.location.href);

if (monkeyWindow.onurlchange === null) {
  monkeyWindow.addEventListener("urlchange", (evt) => {
    handleUrlChange(evt.url);
  });
}
// #endregion

unsafeWindow.WebSocket = MyWebSocket;
unsafeWindow.XMLHttpRequest = MyXMLHttpRequest;
unsafeWindow.yktStorage = storage;
unsafeWindow.yktAPI = API;
