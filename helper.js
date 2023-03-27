// ==UserScript==
// @name         雨课堂 helper
// @version      0.1.0
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
      this.problemAnswers = new Map();

      this.unlockedProblems = new Set();
      this.lastProblem = null;

      this.autoAnswer = false;
      this.autoAnswerDelay = [5 * 1000, 10 * 1000];

      window.addEventListener("keydown", (evt) => {
        if (evt.key === "F9") {
          if (this.lastProblem) {
            this.revealAnswers(this.lastProblem);
          }
        } else if (evt.key === "F10") {
          this.autoAnswer = !this.autoAnswer;
          $toast({
            message: `自动作答：${this.autoAnswer ? "开" : "关"}`,
            duration: 1500
          });
        }
      });
    }

    onPresentationLoaded(id, resp) {
      if (resp.code !== 0) {
        throw new Error(`Failed to load presentation ${id}: ${resp.msg}`);
      }

      const presentation = resp.data;
      this.presentations.set(id, presentation);

      for (const slide of presentation.slides) {
        this.slides.set(slide.id, slide);

        if (typeof slide.problem === "object") {
          this.problems.set(slide.problem.problemId, slide.problem);
        }
      }

      // save presentation data in local storage
      let list;
      try {
        list = new Map(JSON.parse(localStorage.getItem("ykt-helper:presentations")));
      } catch (err) {
        list = new Map();
      }
      list.set(id, presentation);
      localStorage.setItem("ykt-helper:presentations", JSON.stringify([...list]));
    }

    onWebSocketMessage(message) {
      switch (message.op) {
        case "fetchtimeline":
          this.onFetchTimeline(message.timeline);
          break;

        case "unlockproblem":
          this.onUnlockProblem(message.problem);
          break;
      }
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
      this.notifyProblem(problem, slide);

      if (this.autoAnswer && problem) {
        this.doAutoAnswer(problem);
      }
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
        body = `Problem #${data.prob} not found`;
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
      if (!result) return;

      const content = ["内容：" + JSON.stringify(result)];

      let delay = randInt(...this.autoAnswerDelay);
      setTimeout(async () => {
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
            helper.onWebSocketMessage(JSON.parse(evt.data));
          } catch (err) {
            console.error(err);
          }
        });
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

  window.WebSocket = MyWebSocket;
  window.XMLHttpRequest = MyXMLHttpRequest;
  window.yktAPI = API;
  window.yktHelper = helper;

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
})();