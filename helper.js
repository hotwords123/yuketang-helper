// ==UserScript==
// @name         雨课堂 helper
// @version      0.2.5
// @description  雨课堂辅助工具：课堂习题提示，自动作答习题
// @author       hotwords123
// @match        https://pro.yuketang.cn/lesson/fullscreen/v3/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yuketang.cn
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  /**
   * Returns a random integer in [l, r].
   * @param {number} l
   * @param {number} r
   */
  function randInt(l, r) {
    return l + Math.floor(Math.random() * (r - l + 1));
  }

  /**
   * Shuffles the elements in the array.
   * @param {Array} array
   */
  function shuffleArray(array) {
    for (let i = 1; i < array.length; i++) {
      let j = randInt(0, i);
      if (j != i) {
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    return array;
  }

  /**
   * Adds a <style> element to the document.
   * @param {string} content stylesheet content
   */
  function addStyle(content) {
    const styleElement = document.createElement("style");
    styleElement.textContent = content;
    document.head.appendChild(styleElement);
  }

  /**
   * Adds a <script> element to the document.
   * @param {string} source script url
   * @returns {Promise<void>}
   */
  function addScript(source) {
    return new Promise((resolve, reject) => {
      const scriptElement = document.createElement("script");
      scriptElement.src = source;
      scriptElement.addEventListener("load", resolve);
      scriptElement.addEventListener("error", reject);
      document.head.appendChild(scriptElement);
    });
  }

  /**
   * Returns a (getter, setter) pair for lazy evaluation.
   * @returns {[Promise<any>, (value: any) => void]}
   */
  function lazyEvaluator() {
    let callback;
    let promise = new Promise(resolve => {
      callback = resolve;
    });
    return [promise, callback];
  }

  const storage = {
    prefix: "ykt-helper:",

    get(key, defaultValue = null) {
      let value = localStorage.getItem(this.prefix + key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch (err) {}
      }
      return defaultValue;
    },

    set(key, value) {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    },

    remove(key) {
      localStorage.removeItem(this.prefix + key);
    },

    getMap(key) {
      try {
        return new Map(this.get(key, []));
      } catch (err) {
        return new Map();
      }
    },

    setMap(key, map) {
      this.set(key, [...map]);
    },

    alterMap(key, callback) {
      const map = this.getMap(key);
      callback(map);
      this.setMap(key, map);
    }
  };

  const API = {
    async fetch(method, path, options = {}) {
      const url = new URL("https://pro.yuketang.cn/api" + path);
      const init = {
        method: method,
        headers: {
          "authorization": "Bearer " + localStorage.getItem("Authorization"),
          "x-client": "h5",
          "xtbz": "ykt",
          ...options.headers
        },
        mode: "cors",
        credentials: "include"
      };

      if (options.params) {
        for (const key in options.params) {
          url.searchParams.set(key, options.params[key]);
        }
      }

      if (options.body) {
        init.headers["content-type"] = "application/json; charset=utf-8";
        init.body = JSON.stringify(options.body);
      }

      const resp = await fetch(url.href, init);
      if (resp.headers.has("set-auth")) {
        localStorage.setItem("Authorization", resp.headers.get("set-auth"));
      }

      const json = await resp.json();
      return json;
    },

    answerProblem(problem, result) {
      return this.fetch("POST", "/v3/lesson/problem/answer", {
        body: {
          problemId: problem.problemId,
          problemType: problem.problemType,
          dt: Date.now(),
          result: result
        }
      });
    }
  };

  /**
   * Main helper class.
   */
  class YuketangHelper {
    static PROBLEM_TYPE_MAP = {
      1: "单选题", 2: "多选题", 3: "投票题", 4: "填空题", 5: "主观题"
    };
    static instance;

    constructor() {
      YuketangHelper.instance = this;

      this.presentations = new Map();
      this.slides = new Map();
      this.problems = new Map();
      this.problemAnswers = new class extends Map {
        constructor() {
          super(storage.getMap("auto-answer"));
        }

        set(key, value) {
          super.set(key, value);
          storage.alterMap("auto-answer", map => map.set(key, value));
        }

        delete(key) {
          super.delete(key);
          storage.alterMap("auto-answer", map => map.delete(key));
        }

        clear() {
          super.clear();
          storage.remove("auto-answer");
        }
      };

      this.messagesReceived = [];
      this.messagesSent = [];
      this.unlockedProblems = new Set();
      this.lastProblem = null;

      this.autoAnswer = false;
      this.autoAnswerDelay = [3 * 1000, 6 * 1000];
      this.autoAnswerTimers = [];

      const [getter, setter] = lazyEvaluator();
      this.vueApp = getter;
      this.setVueApp = setter;

      window.addEventListener("keydown", (evt) => {
        if (evt.key === "F10") {
          if (this.autoAnswerTimers.length > 0) {
            let timer = this.autoAnswerTimers.shift();
            clearTimeout(timer);
            $toast({
              message: "已取消自动作答",
              duration: 3000
            });
          }
        }
      });
    }

    onPresentationLoaded(id, resp) {
      if (resp.code !== 0) {
        throw new Error(`Failed to load presentation ${id}: ${resp.msg}`);
      }

      if (this.presentations.has(id)) return;

      const presentation = resp.data;
      this.presentations.set(id, presentation);

      const problemSlides = [];
      for (const slide of presentation.slides) {
        this.slides.set(slide.id, slide);

        if (slide.problem) {
          problemSlides.push(slide);
          this.problems.set(slide.problem.problemId, slide.problem);
        }
      }

      console.group(`【课件】${presentation.title}`);
      console.log("课件", presentation);
      console.log("题目页面", problemSlides);
      console.groupEnd();

      this.vueApp.then(vueApp => {
        vueApp.appendPresentation(id, presentation);
      });

      // save presentation data in local storage
      storage.alterMap("presentations", map => map.set(id, presentation));
    }

    onWebSocketMessageReceived(message) {
      this.messagesReceived.push(message);

      switch (message.op) {
        case "fetchtimeline":
          this.onFetchTimeline(message.timeline);
          break;

        case "unlockproblem":
          this.onUnlockProblem(message.problem);
          break;

        case "lessonfinished":
          this.onLessonFinished();
          break;
      }
    }

    onWebSocketMessageSent(message) {
      this.messagesSent.push(message);
    }

    onFetchTimeline(timeline) {
      for (const piece of timeline) {
        if (piece.type === "problem") {
          this.onUnlockProblem(piece);
        }
      }
    }

    onUnlockProblem(data) {
      if (this.unlockedProblems.has(data.prob)) return;
      this.unlockedProblems.add(data.prob);

      const endTime = data.dt + 1000 * data.limit;
      if (Date.now() > endTime) return;

      const problem = this.problems.get(data.prob);
      const slide = this.slides.get(data.sid);

      this.lastProblem = problem || null;
      this.vueApp.then(vueApp => {
        vueApp.canRevealAnswers = this.lastProblem !== null;
      });
      this.notifyProblem(problem, slide);

      if (this.autoAnswer && problem) {
        this.doAutoAnswer(problem);
      }
    }

    onLessonFinished() {
      const notification = new Notification("下课提示", {
        body: "当前课程已结束",
        tag: "lesson-finished-notice"
      });

      notification.addEventListener("error", (evt) => {
        console.error(evt);
      });
    }

    notifyProblem(problem, slide) {
      let body;
      if (problem) {
        const content = [problem.body];
        if (Array.isArray(problem.options) && problem.options.length > 0) {
          content.push(...problem.options.map(({ key, value }) => `${key}. ${value}`));
        }
        body = content.join("\n");

        console.group("【习题】", problem.problemId, problem.body);
        console.log(problem);
        console.groupEnd();
      } else {
        body = "题目未找到";
      }

      const notification = new Notification("课堂习题提示", {
        body,
        image: slide && slide.thumbnail,
        tag: "problem-notice",
        renotify: true
      });

      notification.addEventListener("click", (evt) => {
        window.focus();
      });

      notification.addEventListener("error", (evt) => {
        console.error(evt);
      });
    }

    getAnswerToProblem(problem) {
      if (this.problemAnswers.has(problem.problemId))
        return this.problemAnswers.get(problem.problemId);

      switch (problem.problemType) {
        case 1: case 2:
          return problem.answers;

        case 3: {
          let choices = problem.options.map(option => option.key);
          let count = randInt(1, problem.pollingCount);
          return shuffleArray(choices).slice(0, count).sort();
        }

        case 4:
          return problem.blanks.map(blank => blank.answers[0]);

        default:
          return null;
      }
    }

    doAutoAnswer(problem) {
      let result = this.getAnswerToProblem(problem);
      if (!result) {
        $toast({
          message: "未指定提交内容，无法自动作答本题",
          duration: 3000
        });
        return;
      }

      const content = ["内容：" + JSON.stringify(result)];

      let delay = randInt(...this.autoAnswerDelay);
      let timer = setTimeout(async () => {
        let index = this.autoAnswerTimers.indexOf(timer);
        if (index !== -1) this.autoAnswerTimers.splice(index, 1);

        try {
          const resp = await API.answerProblem(problem, result);
          if (resp.code === 0) {
            content.push("作答完成");
          } else {
            content.push(`作答失败：${resp.msg} (${resp.code})`);
          }
        } catch (err) {
          content.push(`作答失败：${err.message}`);
          console.error(err);
        }

        const message = content.join("\n");
        console.group("【自动作答】", problem.problemId, problem.body);
        console.log(message);
        console.groupEnd();

        const notification = new Notification("自动作答提示", {
          body: message,
          tag: "problem-auto-answer",
          renotify: true
        });

        notification.addEventListener("error", (evt) => {
          console.error(evt);
        });
      }, delay);

      this.autoAnswerTimers.push(timer);
      $toast({
        message: `将在 ${Math.round(delay / 1000)} 秒后自动作答本题，按 F10 取消`,
        duration: 3000
      });
    }

    revealAnswers(problem) {
      const content = [
        `类型：${YuketangHelper.PROBLEM_TYPE_MAP[problem.problemType] || "未知"}`,
        `题面：${problem.body || "无"}`,
      ];

      switch (problem.problemType) {
        case 1: case 2: { // multiple-choice
          content.push(`答案：${problem.answers.join("")}`);
          break;
        }

        case 4: {
          content.push(...problem.blanks.map((({ answers }, i) => `答案 ${i + 1}：${JSON.stringify(answers)}`)));
          break;
        }
      }

      alert(content.join("\n"));
    }
  }

  const helper = new YuketangHelper();

  /**
   * Intercepts WebSocket messages and forwards them to the helper.
   */
  class MyWebSocket extends WebSocket {
    static _WebSocket = WebSocket;

    constructor(url, protocols) {
      super(url, protocols);

      if (url === "wss://pro.yuketang.cn/wsapp/") {
        this.addEventListener("message", (evt) => {
          try {
            helper.onWebSocketMessageReceived(JSON.parse(evt.data));
          } catch (err) {
            console.error(err);
          }
        });

        this.send = data => {
          try {
            helper.onWebSocketMessageSent(JSON.parse(data));
          } catch (err) {
            console.error(err);
          }
          return super.send(data);
        };
      }
    }
  }

  /**
   * Intercepts XMLHttpRequests and forwards them to the helper.
   */
  class MyXMLHttpRequest extends XMLHttpRequest {
    static _XMLHttpRequest = XMLHttpRequest;

    open(method, url, async) {
      const parsed = new URL(url, location.href);
      if (parsed.pathname === "/api/v3/lesson/presentation/fetch") {
        this.addEventListener("load", (evt) => {
          try {
            const id = parsed.searchParams.get("presentation_id");
            helper.onPresentationLoaded(id, JSON.parse(this.responseText));
          } catch (err) {
            console.error(err);
          }
        });
      }
      return super.open(method, url, async);
    }
  }

  addStyle(`
    @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");

    #ykt-helper * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    #ykt-helper>.toolbar {
      position: fixed;
      z-index: 2000001;
      left: 15px;
      bottom: 15px;
      width: 100px;
      height: 36px;
      padding: 5px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #cccccc;
      border-radius: 4px;
      box-shadow: 0 1px 4px 3px rgba(0, 0, 0, .1);
    }

    #ykt-helper>.toolbar>.btn {
      display: inline-block;
      padding: 4px;
      cursor: pointer;
      color: #607190;
    }

    #ykt-helper>.toolbar>.btn:hover {
      color: #1e3050;
    }

    #ykt-helper>.toolbar>.btn.active {
      color: #1d63df;
    }

    #ykt-helper>.toolbar>.btn.active:hover {
      color: #1b53ac;
    }

    #ykt-helper>.toolbar>.btn.disabled {
      color: #bbbbbb;
      cursor: default;
    }

    #ykt-helper>.problem-ui-container {
      position: fixed;
      z-index: 100;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(64, 64, 64, 0.4);
    }

    #ykt-helper .problem-ui {
      display: grid;
      grid-template: auto 36px / 240px auto;
      width: 80%;
      height: 90%;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #bbbbbb;
      border-radius: 5px;
      overflow: hidden;
    }

    #ykt-helper .problem-ui>.list {
      grid-row: 1;
      grid-column: 1;
      padding: 5px 15px;
      overflow-y: auto;
    }

    #ykt-helper .problem-ui>.list .title {
      font-weight: bold;
      overflow: hidden;
      margin: 10px 0;
    }

    #ykt-helper .problem-ui>.list .title:after {
      content: "";
      display: inline-block;
      height: 1px;
      background: #aaaaaa;
      position: relative;
      vertical-align: middle;
      width: 100%;
      left: 1em;
      margin-right: -100%;
    }

    #ykt-helper .problem-ui>.list .slide {
      position: relative;
      margin: 10px 0;
      border: 2px solid #dddddd;
      cursor: pointer;
    }

    #ykt-helper .problem-ui>.list .slide>img {
      display: block;
      width: 100%;
    }

    #ykt-helper .problem-ui>.list .slide>.tag {
      position: absolute;
      top: 0;
      left: 0;
      display: inline-block;
      padding: 3px 5px;
      font-size: small;
      color: #f7f7f7;
      background: rgba(64, 64, 64, .4);
    }

    #ykt-helper .problem-ui>.list .slide.active {
      border-color: #2d70e7;
    }

    #ykt-helper .problem-ui>.list .slide.active>.tag {
      background: #2d70e7;
    }

    #ykt-helper .problem-ui>.toolbar {
      grid-row: 2;
      grid-column: 1;
      padding: 5px 15px;
      line-height: 26px;
      border-top: 1px solid #bbbbbb;
    }

    #ykt-helper .problem-ui>.toolbar label {
      font-size: small;
    }

    #ykt-helper .problem-ui>.toolbar input[type="checkbox"] {
      appearance: auto;
      vertical-align: middle;
    }

    #ykt-helper .problem-ui>.detail {
      grid-row: 1 / span 2;
      gird-column: 2;
      padding: 25px 40px;
      overflow-y: auto;
      border-left: 1px solid #bbbbbb;
    }

    #ykt-helper .problem-ui>.detail .cover {
      border: 1px solid #dddddd;
      box-shadow: 0 1px 4px 3px rgba(0, 0, 0, .1);
    }

    #ykt-helper .problem-ui>.detail .cover>img {
      display: block;
      width: 100%;
    }

    #ykt-helper .problem-ui>.detail .body {
      margin-top: 25px;
    }

    #ykt-helper .problem-ui>.detail .body>textarea {
      width: 100%;
      min-height: 40px;
      resize: vertical;
    }

    #ykt-helper .problem-ui>.detail .actions {
      margin-top: 25px;
      text-align: center;
    }

    #ykt-helper .problem-ui>.detail .actions>button {
      margin: 0 20px;
      padding: 4px 10px;
    }
  `);

  addScript("https://unpkg.com/vue@3/dist/vue.global.js").then(() => {
    console.log("vue loaded");

    const appContainer = document.createElement("div");
    appContainer.id = "ykt-helper";
    document.body.appendChild(appContainer);

    const app = Vue.createApp({
      template: `
        <div class="toolbar">
          <span class="btn" title="查看习题答案" :class="{ disabled: !canRevealAnswers }" @click="revealAnswers(null)">
            <i class="fas fa-eye fa-lg"></i>
          </span>
          <span class="btn" title="切换自动作答" :class="{ active: autoAnswerEnabled }" @click="toggleAutoAnswer()">
            <i class="fas fa-upload fa-lg"></i>
          </span>
          <span class="btn" title="显示习题列表" :class="{ active: problemUIVisible }" @click="problemUIVisible = !problemUIVisible">
            <i class="fas fa-list-check fa-lg"></i>
          </span>
        </div>
        <div v-if="problemUIVisible" class="problem-ui-container">
          <div class="problem-ui">
            <div class="list">
              <template v-for="presentation in filteredPresentations" :key="presentation.id">
                <div class="title">{{ presentation.title }}</div>
                <div class="slide" v-for="slide in presentation.slides" :key="slide.id" :class="{ active: slide === currentSlide }" @click="setCurrentSlide(slide, presentation)">
                  <img :src="slide.thumbnail" :style="{ aspectRatio: presentation.meta.width + '/' + presentation.meta.height }">
                  <span class="tag">{{ slide.index }}</span>
                </div>
              </template>
            </div>
            <div class="toolbar">
              <label>
                <input type="checkbox" v-model="showAllSlides">
                显示全部页面
              </label>
            </div>
            <div class="detail">
              <template v-if="currentSlide">
                <div class="cover">
                  <img :src="currentSlide.cover" :style="{ aspectRatio: currentPresentation.meta.width + '/' + currentPresentation.meta.height }">
                </div>
                <template v-if="currentSlide.problem">
                  <div class="body">
                    <p>题面：{{ currentSlide.problem.body || "空" }}</p>
                    <textarea v-model="autoAnswerContent" rows="6" placeholder="自动作答内容"></textarea>
                  </div>
                  <div class="actions">
                    <button @click="revealAnswers(currentSlide.problem)">查看答案</button>
                    <button @click="confirmAutoAnswer">自动作答</button>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      `,

      data() {
        return {
          canRevealAnswers: false,
          autoAnswerEnabled: false,
          problemUIVisible: false,
          presentations: [],
          currentPresentation: null,
          currentSlide: null,
          showAllSlides: false,
          autoAnswerContent: ""
        }
      },

      computed: {
        filteredPresentations() {
          return this.presentations.map(({ slides, ...more }) => ({
            slides: slides.filter(slide => this.showAllSlides || !!slide.problem),
            ...more
          }));
        }
      },

      methods: {
        revealAnswers(problem) {
          problem = problem || helper.lastProblem;
          if (problem) {
            helper.revealAnswers(problem);
          }
        },

        toggleAutoAnswer() {
          this.autoAnswerEnabled = helper.autoAnswer = !helper.autoAnswer;
          $toast({
            message: `自动作答：${this.autoAnswerEnabled ? "开" : "关"}`,
            duration: 1500
          });
        },

        appendPresentation(id, presentation) {
          const { title, slides, ...meta } = presentation;
          this.presentations.push({
            id, title, meta,
            slides: JSON.parse(JSON.stringify(slides))
          });
        },

        setCurrentSlide(slide, presentation) {
          this.currentSlide = slide;
          this.currentPresentation = presentation;
          if (slide) {
            const problem = slide.problem;
            const result = helper.problemAnswers.get(problem.problemId);
            this.autoAnswerContent = this.loadAutoAnswerContent(problem.problemType, result);
          }
        },

        loadAutoAnswerContent(problemType, result) {
          switch (problemType) {
            case 1: case 2: case 3:
              if (Array.isArray(result))
                return result.join("");
              break;
            case 4:
              if (Array.isArray(result))
                return result.join("\n");
              break;
            case 5:
              if (result && typeof result.content === "string")
                return result.content;
              break;
          }
          return "";
        },

        confirmAutoAnswer() {
          const problem = this.currentSlide.problem;
          const content = this.autoAnswerContent;

          if (content === "") {
            helper.problemAnswers.delete(problem.problemId);
            $toast({
              message: "已重置本题的自动作答内容",
              duration: 3000
            });
          } else {
            let result;
            switch (problem.problemType) {
              case 1: case 2: case 3:
                result = content.split("").sort();
                break;
              case 4:
                result = content.split("\n").filter(text => !!text);
                break;
              case 5:
                // { content: string, pics: { pic: string, thumb: string }[] }
                result = { content, pics: [] };
                break;
            }
            helper.problemAnswers.set(problem.problemId, result);
            $toast({
              message: "已设置本题的自动作答内容",
              duration: 3000
            });
          }
        }
      }
    }).mount("#ykt-helper");

    helper.setVueApp(app);
    window.yktApp = app;

  }).catch(console.error);

  window.WebSocket = MyWebSocket;
  window.XMLHttpRequest = MyXMLHttpRequest;
  window.yktAPI = API;
  window.yktHelper = helper;

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // debug mode
  if (location.href.endsWith("test")) {
    setTimeout(() => {
      const presentations = JSON.parse(localStorage.getItem("ykt-helper:presentations"));
      for (const [id, presentation] of presentations) {
        helper.onPresentationLoaded(id, { code: 0, data: presentation });
      }
    }, 2000);
  }
})();