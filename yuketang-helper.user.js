// ==UserScript==
// @name         雨课堂 helper
// @namespace    https://github.com/hotwords123/yuketang-helper
// @version      1.2.1
// @author       hotwords123
// @description  雨课堂辅助工具：课堂习题提示，自动作答习题
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yuketang.cn
// @match        https://pro.yuketang.cn/*
// @require      https://cdn.jsdelivr.net/npm/vue@3.3.13/dist/vue.global.prod.js
// @require      https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js
// @grant        GM_addStyle
// @grant        GM_getTab
// @grant        GM_getTabs
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_saveTab
// @grant        unsafeWindow
// ==/UserScript==

(a=>{if(typeof GM_addStyle=="function"){GM_addStyle(a);return}const t=document.createElement("style");t.textContent=a,document.head.append(t)})(' @import"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";#watermark_layer{display:none!important;visibility:hidden!important}.container[data-v-64c62bb5]{position:fixed;z-index:100;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:rgba(64,64,64,.4)}.popup[data-v-64c62bb5]{display:grid;grid-template:auto 36px / 240px auto;width:80%;height:90%;background:rgba(255,255,255,.9);border:1px solid #bbbbbb;border-radius:5px;overflow:hidden}.list[data-v-64c62bb5]{grid-row:1;grid-column:1;padding:5px 15px;overflow-y:auto}.list .title[data-v-64c62bb5]{font-weight:700;overflow:hidden;margin:10px 0}.list .title[data-v-64c62bb5]:after{content:"";display:inline-block;height:1px;background:#aaaaaa;position:relative;vertical-align:middle;width:100%;left:1em;margin-right:-100%}.list .title .download-btn[data-v-64c62bb5]{cursor:pointer}.list .slide[data-v-64c62bb5]{position:relative;margin:10px 0;border:2px solid #dddddd;cursor:pointer}.list .slide>img[data-v-64c62bb5]{display:block;width:100%}.list .slide>.tag[data-v-64c62bb5]{position:absolute;top:0;left:0;display:inline-block;padding:3px 5px;font-size:small;color:#f7f7f7;background:rgba(64,64,64,.4)}.list .slide.active[data-v-64c62bb5]{border-color:#2d70e7}.list .slide.active>.tag[data-v-64c62bb5]{background:#2d70e7}.list .slide.unlocked[data-v-64c62bb5]{border-color:#d7d48e}.list .slide.unlocked.active[data-v-64c62bb5]{border-color:#e6cb2d}.list .slide.unlocked.active>.tag[data-v-64c62bb5]{background:#e6cb2d}.list .slide.answered[data-v-64c62bb5]{border-color:#8dd790}.list .slide.answered.active[data-v-64c62bb5]{border-color:#4caf50}.list .slide.answered.active>.tag[data-v-64c62bb5]{background:#4caf50}.tail[data-v-64c62bb5]{grid-row:2;grid-column:1;padding:5px 15px;line-height:26px;border-top:1px solid #bbbbbb}.tail label[data-v-64c62bb5]{font-size:small}.tail input[type=checkbox][data-v-64c62bb5]{-webkit-appearance:auto;-moz-appearance:auto;appearance:auto;vertical-align:middle}.detail[data-v-64c62bb5]{grid-row:1 / span 2;grid-column:2;padding:25px 40px;overflow-y:auto;border-left:1px solid #bbbbbb}.detail .cover[data-v-64c62bb5]{border:1px solid #dddddd;box-shadow:0 1px 4px 3px #0000001a}.detail .cover>img[data-v-64c62bb5]{display:block;width:100%}.detail .body[data-v-64c62bb5]{margin-top:25px}.detail .body>textarea[data-v-64c62bb5]{width:100%;min-height:40px;resize:vertical}.detail .actions[data-v-64c62bb5]{margin-top:25px;text-align:center}.detail .actions>button[data-v-64c62bb5]{margin:0 20px;padding:4px 10px}*[data-v-1c8fbbdf]{margin:0;padding:0;box-sizing:border-box}.toolbar[data-v-1c8fbbdf]{position:fixed;z-index:2000001;left:15px;bottom:15px;width:100px;height:36px;padding:5px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;background:#ffffff;border:1px solid #cccccc;border-radius:4px;box-shadow:0 1px 4px 3px #0000001a}.toolbar>.btn[data-v-1c8fbbdf]{display:inline-block;padding:4px;cursor:pointer;color:#607190}.toolbar>.btn[data-v-1c8fbbdf]:hover{color:#1e3050}.toolbar>.btn.active[data-v-1c8fbbdf]{color:#1d63df}.toolbar>.btn.active[data-v-1c8fbbdf]:hover{color:#1b53ac}.toolbar>.btn.disabled[data-v-1c8fbbdf]{color:#bbb;cursor:default} ');

(function (vue, jspdf) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var _GM_getTab = /* @__PURE__ */ (() => typeof GM_getTab != "undefined" ? GM_getTab : void 0)();
  var _GM_getTabs = /* @__PURE__ */ (() => typeof GM_getTabs != "undefined" ? GM_getTabs : void 0)();
  var _GM_notification = /* @__PURE__ */ (() => typeof GM_notification != "undefined" ? GM_notification : void 0)();
  var _GM_openInTab = /* @__PURE__ */ (() => typeof GM_openInTab != "undefined" ? GM_openInTab : void 0)();
  var _GM_saveTab = /* @__PURE__ */ (() => typeof GM_saveTab != "undefined" ? GM_saveTab : void 0)();
  var _unsafeWindow = /* @__PURE__ */ (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  class StorageManager {
    constructor(prefix) {
      this.prefix = prefix;
    }
    get(key, defaultValue = null) {
      let value = localStorage.getItem(this.prefix + key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch (err) {
          console.error(err);
        }
      }
      return defaultValue;
    }
    set(key, value) {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }
    remove(key) {
      localStorage.removeItem(this.prefix + key);
    }
    getMap(key) {
      try {
        return new Map(this.get(key, []));
      } catch (err) {
        console.error(err);
        return /* @__PURE__ */ new Map();
      }
    }
    setMap(key, map) {
      this.set(key, [...map]);
    }
    alterMap(key, callback) {
      const map = this.getMap(key);
      callback(map);
      this.setMap(key, map);
    }
  }
  const storage = new StorageManager("ykt-helper:");
  async function request(path, options = {}) {
    const url2 = new URL(path, "https://pro.yuketang.cn");
    const init = {
      method: options.method ?? "GET",
      headers: options.headers,
      mode: "cors",
      credentials: "include"
    };
    if (options.bearer) {
      init.headers["Authorization"] = "Bearer " + localStorage.getItem("Authorization");
    }
    if (options.params) {
      for (const key in options.params) {
        url2.searchParams.set(key, options.params[key]);
      }
    }
    if (options.body) {
      init.headers["Content-Type"] = "application/json; charset=utf-8";
      init.body = JSON.stringify(options.body);
    }
    const resp = await fetch(url2.href, init);
    if (options.bearer && resp.headers.has("Set-Auth")) {
      localStorage.setItem("Authorization", resp.headers.get("Set-Auth"));
    }
    const json = await resp.json();
    return json;
  }
  const H5_HEADERS = {
    "xtbz": "ykt",
    "X-Client": "h5"
  };
  const WEB_HEADERS = {
    "university-id": "0",
    "uv-id": "0",
    "X-Client": "web",
    "Xt-Agent": "web"
  };
  function answerProblem(problem, result, dt = Date.now()) {
    return request("/api/v3/lesson/problem/answer", {
      method: "POST",
      headers: H5_HEADERS,
      body: {
        problemId: problem.problemId,
        problemType: problem.problemType,
        dt,
        result
      },
      bearer: true
    });
  }
  function retryProblem(problem, result, dt) {
    return request("/api/v3/lesson/problem/retry", {
      method: "POST",
      headers: H5_HEADERS,
      body: {
        problems: [{
          problemId: problem.problemId,
          problemType: problem.problemType,
          dt,
          result
        }]
      },
      bearer: true
    });
  }
  async function getActiveLessons() {
    return request("/api/v3/classroom/on-lesson-upcoming-exam", {
      method: "GET",
      headers: WEB_HEADERS
    });
  }
  async function getCourseList() {
    return request("/v2/api/web/courses/list?identity=2", {
      method: "GET",
      headers: WEB_HEADERS
    });
  }
  const API = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    H5_HEADERS,
    WEB_HEADERS,
    answerProblem,
    getActiveLessons,
    getCourseList,
    request,
    retryProblem
  }, Symbol.toStringTag, { value: "Module" }));
  class MyWebSocket extends WebSocket {
    static addHandler(handler) {
      this.handlers.push(handler);
    }
    constructor(url2, protocols) {
      super(url2, protocols);
      for (const handler of this.constructor.handlers) {
        handler(this, url2);
      }
    }
    intercept(callback) {
      this.send = (data) => {
        try {
          callback(JSON.parse(data));
        } finally {
          return super.send(data);
        }
      };
    }
    listen(callback) {
      this.addEventListener("message", (evt) => {
        callback(JSON.parse(evt.data));
      });
    }
  }
  __publicField(MyWebSocket, "original", WebSocket);
  __publicField(MyWebSocket, "handlers", []);
  class MyXMLHttpRequest extends XMLHttpRequest {
    static addHandler(handler) {
      this.handlers.push(handler);
    }
    open(method, url2, async) {
      const parsed = new URL(url2, location.href);
      for (const handler of this.constructor.handlers) {
        handler(this, method, parsed);
      }
      return super.open(method, url2, async);
    }
    intercept(callback) {
      let payload;
      this.send = (body) => {
        payload = body;
        return super.send(body);
      };
      this.addEventListener("load", () => {
        callback(JSON.parse(this.responseText), payload);
      });
    }
  }
  __publicField(MyXMLHttpRequest, "original", XMLHttpRequest);
  __publicField(MyXMLHttpRequest, "handlers", []);
  const PROBLEM_TYPE_MAP = {
    1: "单选题",
    2: "多选题",
    3: "投票题",
    4: "填空题",
    5: "主观题"
  };
  function randInt(l, r) {
    return l + Math.floor(Math.random() * (r - l + 1));
  }
  function shuffleArray(array) {
    for (let i = 1; i < array.length; i++) {
      let j = randInt(0, i);
      if (j != i) {
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    return array;
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (evt) => {
        console.error(evt);
        reject(new Error("Failed to load image: " + src));
      };
    });
  }
  const _hoisted_1$2 = { key: 0 };
  const _hoisted_2$2 = { key: 2 };
  const _sfc_main$2 = {
    __name: "AnswerReveal",
    props: [
      "problem",
      "revealed",
      "onReveal"
    ],
    setup(__props) {
      const props = __props;
      return (_ctx, _cache) => {
        return !props.revealed ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_1$2, [
          vue.createTextVNode(" 答案："),
          vue.createElementVNode("a", {
            href: "#",
            onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => {
              var _a;
              return (_a = props.onReveal) == null ? void 0 : _a.call(props);
            }, ["prevent"]))
          }, "查看答案")
        ])) : props.problem.problemType === 4 ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 1 }, vue.renderList(props.problem.blanks, (blank, key) => {
          return vue.openBlock(), vue.createElementBlock("p", null, [
            vue.createTextVNode(" 答案 " + vue.toDisplayString(key + 1) + "：", 1),
            vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(blank.answers)), 1)
          ]);
        }), 256)) : (vue.openBlock(), vue.createElementBlock("p", _hoisted_2$2, [
          vue.createTextVNode(" 答案："),
          vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(props.problem.answers)), 1)
        ]));
      };
    }
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _hoisted_1$1 = { class: "container" };
  const _hoisted_2$1 = { class: "popup" };
  const _hoisted_3$1 = { class: "list" };
  const _hoisted_4$1 = { class: "title" };
  const _hoisted_5$1 = ["onClick"];
  const _hoisted_6$1 = ["onClick"];
  const _hoisted_7$1 = ["src"];
  const _hoisted_8 = { class: "tag" };
  const _hoisted_9 = { class: "tail" };
  const _hoisted_10 = { class: "detail" };
  const _hoisted_11 = { class: "cover" };
  const _hoisted_12 = ["src"];
  const _hoisted_13 = { class: "body" };
  const _hoisted_14 = { key: 1 };
  const _hoisted_15 = { class: "actions" };
  const _hoisted_16 = ["disabled"];
  const _sfc_main$1 = {
    __name: "ProblemUI",
    props: [
      "config",
      "presentations",
      "problemStatus",
      "onAnswerProblem"
    ],
    setup(__props) {
      const props = __props;
      const showAllSlides = vue.ref(false);
      const currentPresentation = vue.ref(null);
      const currentSlide = vue.ref(null);
      const currentProblem = vue.computed(() => {
        var _a;
        return (_a = currentSlide.value) == null ? void 0 : _a.problem;
      });
      const answerContent = vue.ref("");
      const filteredPresentations = vue.computed(() => {
        return [...props.presentations.values()].map(({ slides, ...more }) => ({
          slides: slides.filter((slide) => showAllSlides.value || slide.problem),
          ...more
        }));
      });
      function slideClass(slide) {
        const problem = slide.problem;
        return {
          active: slide === currentSlide.value,
          ...problem && {
            unlocked: props.problemStatus.has(problem.problemId),
            answered: !!problem.result
          }
        };
      }
      function coverStyle(presentation) {
        const { width, height } = presentation;
        return { aspectRatio: width + "/" + height };
      }
      function setCurrentSlide(slide, presentation) {
        currentPresentation.value = presentation;
        currentSlide.value = slide;
        answerContent.value = "";
        const problem = slide.problem;
        if (problem) {
          const problemAnswers = storage.getMap("auto-answer");
          const result = problemAnswers.get(problem.problemId);
          switch (problem.problemType) {
            case 1:
            case 2:
            case 3:
              if (Array.isArray(result))
                answerContent.value = result.join("");
              break;
            case 4:
              if (Array.isArray(result))
                answerContent.value = result.join("\n");
              break;
            case 5:
              if (result && typeof result.content === "string")
                answerContent.value = result.content;
              break;
          }
        }
      }
      const revealedProblemIds = vue.reactive(/* @__PURE__ */ new Set());
      function answerRevealed(problem) {
        return problem.result || revealedProblemIds.has(problem.problemId);
      }
      function revealAnswer(problem) {
        revealedProblemIds.add(problem.problemId);
      }
      function parseAnswer(problemType, content) {
        switch (problemType) {
          case 1:
          case 2:
          case 3:
            return content.split("").sort();
          case 4:
            return content.split("\n").filter((text) => !!text);
          case 5:
            return { content, pics: [] };
        }
      }
      function updateAutoAnswer() {
        const problem = currentProblem.value;
        const content = answerContent.value;
        if (!content) {
          storage.alterMap("auto-answer", (map) => map.delete(problem.problemId));
          $toast({
            message: "已重置本题的自动作答内容",
            duration: 3e3
          });
        } else {
          const result = parseAnswer(problem.problemType, content);
          storage.alterMap("auto-answer", (map) => map.set(problem.problemId, result));
          $toast({
            message: "已设置本题的自动作答内容",
            duration: 3e3
          });
        }
      }
      function canRetry(problem) {
        return props.problemStatus.has(problem.problemId) && !problem.result;
      }
      async function handleRetry(problem) {
        var _a;
        const content = answerContent.value;
        if (!content) {
          $toast({
            message: "作答内容不能为空",
            duration: 3e3
          });
          return;
        }
        if (!confirm("此功能用于补救超时未作答的题目，是否继续？"))
          return;
        try {
          const result = parseAnswer(problem.problemType, content);
          const status = props.problemStatus.get(problem.problemId);
          const dt = status.startTime + randInt(...props.config.autoAnswerDelay);
          const resp = await retryProblem(problem, result, dt);
          if (resp.code !== 0)
            throw new Error(`${resp.msg} (${resp.code})`);
          if (!resp.data.success.includes(problem.problemId))
            throw new Error("服务器未返回成功信息");
          (_a = props.onAnswerProblem) == null ? void 0 : _a.call(props, problem.problemId, result);
          $toast({
            message: "重试作答成功",
            duration: 3e3
          });
        } catch (err) {
          console.error(err);
          $toast({
            message: "重试作答失败：" + err.message,
            duration: 3e3
          });
        }
      }
      async function handleDownload(presentationId) {
        try {
          const presentation = props.presentations.get(presentationId);
          $toast({
            message: "正在下载课件，可能需要一些时间...",
            duration: 3e3
          });
          await savePresentation(presentation);
        } catch (err) {
          console.error(err);
          $toast({
            message: "下载失败：" + err.message,
            duration: 3e3
          });
        }
      }
      async function savePresentation(presentation) {
        const { width, height } = presentation;
        const doc = new jspdf.jsPDF({
          format: [width, height],
          orientation: width > height ? "l" : "p",
          unit: "px",
          putOnlyUsedFonts: true,
          compress: true,
          hotfixes: ["px_scaling"]
        });
        doc.deletePage(1);
        let parent = null;
        for (const slide of presentation.slides) {
          const img = await loadImage(slide.cover);
          doc.addPage();
          doc.addImage(img, "PNG", 0, 0, width, height);
          const pageNumber = doc.getNumberOfPages();
          if (parent === null) {
            parent = doc.outline.add(null, presentation.title, { pageNumber });
          }
          let bookmark = `${slide.index}`;
          if (slide.note) {
            bookmark += `: ${slide.note}`;
          }
          if (slide.problem) {
            bookmark += ` - ${PROBLEM_TYPE_MAP[slide.problem.problemType]}`;
          }
          doc.outline.add(parent, bookmark, { pageNumber });
        }
        doc.save(presentation.title);
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
          vue.createElementVNode("div", _hoisted_2$1, [
            vue.createElementVNode("div", _hoisted_3$1, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(filteredPresentations.value, (presentation) => {
                return vue.openBlock(), vue.createElementBlock(vue.Fragment, {
                  key: presentation.id
                }, [
                  vue.createElementVNode("div", _hoisted_4$1, [
                    vue.createTextVNode(vue.toDisplayString(presentation.title) + " ", 1),
                    vue.createElementVNode("i", {
                      class: "download-btn fas fa-download",
                      onClick: ($event) => handleDownload(presentation.id)
                    }, null, 8, _hoisted_5$1)
                  ]),
                  (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(presentation.slides, (slide) => {
                    return vue.openBlock(), vue.createElementBlock("div", {
                      class: vue.normalizeClass(["slide", slideClass(slide)]),
                      key: slide.id,
                      onClick: ($event) => setCurrentSlide(slide, presentation)
                    }, [
                      vue.createElementVNode("img", {
                        src: slide.thumbnail,
                        style: vue.normalizeStyle(coverStyle(presentation))
                      }, null, 12, _hoisted_7$1),
                      vue.createElementVNode("span", _hoisted_8, vue.toDisplayString(slide.index), 1)
                    ], 10, _hoisted_6$1);
                  }), 128))
                ], 64);
              }), 128))
            ]),
            vue.createElementVNode("div", _hoisted_9, [
              vue.createElementVNode("label", null, [
                vue.withDirectives(vue.createElementVNode("input", {
                  type: "checkbox",
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => showAllSlides.value = $event)
                }, null, 512), [
                  [vue.vModelCheckbox, showAllSlides.value]
                ]),
                vue.createTextVNode(" 显示全部页面 ")
              ])
            ]),
            vue.createElementVNode("div", _hoisted_10, [
              currentSlide.value ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
                vue.createElementVNode("div", _hoisted_11, [
                  (vue.openBlock(), vue.createElementBlock("img", {
                    key: currentSlide.value.id,
                    src: currentSlide.value.cover,
                    style: vue.normalizeStyle(coverStyle(currentPresentation.value))
                  }, null, 12, _hoisted_12))
                ]),
                currentProblem.value ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
                  vue.createElementVNode("div", _hoisted_13, [
                    vue.createElementVNode("p", null, " 题面：" + vue.toDisplayString(currentProblem.value.body || "空"), 1),
                    [1, 2, 4].includes(currentProblem.value.problemType) ? (vue.openBlock(), vue.createBlock(_sfc_main$2, {
                      key: 0,
                      problem: currentProblem.value,
                      revealed: answerRevealed(currentProblem.value),
                      onReveal: _cache[1] || (_cache[1] = ($event) => revealAnswer(currentProblem.value))
                    }, null, 8, ["problem", "revealed"])) : vue.createCommentVNode("", true),
                    currentProblem.value.result ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_14, [
                      vue.createTextVNode(" 作答内容："),
                      vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(currentProblem.value.result)), 1)
                    ])) : vue.createCommentVNode("", true),
                    vue.withDirectives(vue.createElementVNode("textarea", {
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => answerContent.value = $event),
                      rows: "6",
                      placeholder: "自动作答内容"
                    }, null, 512), [
                      [vue.vModelText, answerContent.value]
                    ])
                  ]),
                  vue.createElementVNode("div", _hoisted_15, [
                    vue.createElementVNode("button", {
                      onClick: _cache[3] || (_cache[3] = ($event) => updateAutoAnswer())
                    }, "自动作答"),
                    vue.createElementVNode("button", {
                      disabled: !canRetry(currentProblem.value),
                      onClick: _cache[4] || (_cache[4] = ($event) => handleRetry(currentProblem.value))
                    }, "重试作答", 8, _hoisted_16)
                  ])
                ], 64)) : vue.createCommentVNode("", true)
              ], 64)) : vue.createCommentVNode("", true)
            ])
          ])
        ]);
      };
    }
  };
  const ProblemUI = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-64c62bb5"]]);
  const _withScopeId = (n) => (vue.pushScopeId("data-v-1c8fbbdf"), n = n(), vue.popScopeId(), n);
  const _hoisted_1 = { class: "toolbar" };
  const _hoisted_2 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("i", { class: "fas fa-eye fa-lg" }, null, -1));
  const _hoisted_3 = [
    _hoisted_2
  ];
  const _hoisted_4 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("i", { class: "fas fa-upload fa-lg" }, null, -1));
  const _hoisted_5 = [
    _hoisted_4
  ];
  const _hoisted_6 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ vue.createElementVNode("i", { class: "fas fa-list-check fa-lg" }, null, -1));
  const _hoisted_7 = [
    _hoisted_6
  ];
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      const DEFAULT_CONFIG = {
        autoAnswer: false,
        autoAnswerDelay: [3 * 1e3, 6 * 1e3],
        maxPresentations: 5
      };
      const config = vue.reactive(storage.get("config", DEFAULT_CONFIG));
      vue.watch(config, (value) => storage.set("config", value));
      const presentations = vue.reactive(/* @__PURE__ */ new Map());
      const slides = vue.reactive(/* @__PURE__ */ new Map());
      const problems = vue.reactive(/* @__PURE__ */ new Map());
      const problemStatus = vue.reactive(/* @__PURE__ */ new Map());
      const lastProblem = vue.ref(null);
      MyWebSocket.addHandler((ws, url2) => {
        if (url2 === "wss://pro.yuketang.cn/wsapp/") {
          ws.intercept((message) => {
          });
          ws.listen((message) => {
            switch (message.op) {
              case "fetchtimeline":
                onFetchTimeline(message.timeline);
                break;
              case "unlockproblem":
                onUnlockProblem(message.problem);
                break;
              case "lessonfinished":
                onLessonFinished();
                break;
            }
          });
        }
      });
      function onFetchTimeline(timeline) {
        for (const piece of timeline) {
          if (piece.type === "problem") {
            onUnlockProblem(piece);
          }
        }
      }
      function onUnlockProblem(data) {
        if (problemStatus.has(data.prob))
          return;
        const status = {
          startTime: data.dt,
          endTime: data.dt + 1e3 * data.limit
        };
        problemStatus.set(data.prob, status);
        if (Date.now() > status.endTime)
          return;
        const problem = problems.get(data.prob);
        const slide = slides.get(data.sid);
        if (!problem || !slide)
          return;
        if (problem.result)
          return;
        lastProblem.value = problem;
        notifyProblem(problem, slide);
        if (config.autoAnswer) {
          doAutoAnswer(problem);
        }
      }
      function onLessonFinished() {
        _GM_notification({
          title: "下课提示",
          text: "当前课程已结束",
          tag: "lesson-finished",
          silent: true
        });
      }
      MyXMLHttpRequest.addHandler((xhr, method, url2) => {
        if (url2.pathname === "/api/v3/lesson/presentation/fetch") {
          xhr.intercept((resp) => {
            const id = url2.searchParams.get("presentation_id");
            if (resp.code === 0) {
              onPresentationLoaded(id, resp.data);
            }
          });
        }
        if (url2.pathname === "/api/v3/lesson/redenvelope/issue-list") {
          xhr.intercept((resp) => {
            const id = url2.searchParams.get("redEnvelopeId");
            if (resp.code === 0) {
              onRedEnvelopeListLoaded(id, resp.data);
            }
          });
        }
        if (url2.pathname === "/api/v3/lesson/problem/answer") {
          xhr.intercept((resp, payload) => {
            const { problemId, result } = JSON.parse(payload);
            if (resp.code === 0) {
              onAnswerProblem(problemId, result);
            }
          });
        }
      });
      function onPresentationLoaded(id, data) {
        const presentation = { id, ...data };
        presentations.set(id, presentation);
        for (const slide of presentation.slides) {
          slides.set(slide.id, slide);
          const problem = slide.problem;
          if (problem) {
            problems.set(problem.problemId, problem);
          }
        }
        storage.alterMap("presentations", (map) => {
          map.set(id, data);
          const excess = map.size - config.maxPresentations;
          if (excess > 0) {
            const keys = [...map.keys()].slice(0, excess);
            for (const key of keys) {
              map.delete(key);
            }
          }
        });
      }
      function onRedEnvelopeListLoaded(id, data) {
        storage.alterMap("red-envelopes", (map) => map.set(id, data));
      }
      function onAnswerProblem(problemId, result) {
        const problem = problems.get(problemId);
        if (problem) {
          problem.result = result;
        }
      }
      function notifyProblem(problem, slide) {
        _GM_notification({
          title: "课堂习题提示",
          text: getProblemDetail(problem),
          image: slide == null ? void 0 : slide.thumbnail,
          tag: "problem-notice",
          silent: false
        });
      }
      function getProblemDetail(problem) {
        if (!problem) {
          return "题目未找到";
        }
        const lines = [problem.body];
        if (Array.isArray(problem.options)) {
          lines.push(...problem.options.map(({ key, value }) => `${key}. ${value}`));
        }
        return lines.join("\n");
      }
      const autoAnswerTimers = [];
      window.addEventListener("keydown", (evt) => {
        if (evt.key === "F10") {
          if (autoAnswerTimers.length > 0) {
            const timer = autoAnswerTimers.shift();
            clearTimeout(timer);
            $toast({
              message: "已取消自动作答",
              duration: 3e3
            });
          }
        }
      });
      function doAutoAnswer(problem) {
        const result = getAnswerToProblem(problem);
        if (!result) {
          $toast({
            message: "未指定提交内容，无法自动作答本题",
            duration: 3e3
          });
          return;
        }
        const delay = randInt(...config.autoAnswerDelay);
        const timer = setTimeout(async () => {
          const index = autoAnswerTimers.indexOf(timer);
          if (index !== -1)
            autoAnswerTimers.splice(index, 1);
          const messages = ["内容：" + JSON.stringify(result)];
          try {
            const resp = await answerProblem(problem, result);
            if (resp.code === 0) {
              messages.push("作答完成");
              onAnswerProblem(problem.problemId, result, resp);
            } else {
              messages.push(`作答失败：${resp.msg} (${resp.code})`);
            }
          } catch (err) {
            console.error(err);
            messages.push(`作答失败：${err.message}`);
          }
          _GM_notification({
            title: "自动作答提示",
            text: messages.join("\n"),
            tag: "problem-auto-answer",
            silent: true
          });
        }, delay);
        autoAnswerTimers.push(timer);
        $toast({
          message: `将在 ${Math.round(delay / 1e3)} 秒后自动作答本题，按 F10 取消`,
          duration: 3e3
        });
      }
      function getAnswerToProblem(problem) {
        const problemAnswers = storage.getMap("auto-answer");
        if (problemAnswers.has(problem.problemId))
          return problemAnswers.get(problem.problemId);
        switch (problem.problemType) {
          case 1:
          case 2:
            return problem.answers;
          case 3: {
            const choices = problem.options.map((option) => option.key);
            const count = randInt(1, problem.pollingCount);
            return shuffleArray(choices).slice(0, count).sort();
          }
          case 4:
            return problem.blanks.map((blank) => blank.answers[0]);
          default:
            return null;
        }
      }
      const problemUIVisible = vue.ref(false);
      function revealAnswers(problem) {
        const lines = [
          `类型：${PROBLEM_TYPE_MAP[problem.problemType] || "未知"}`,
          `题面：${problem.body || "无"}`
        ];
        switch (problem.problemType) {
          case 1:
          case 2: {
            lines.push(`答案：${problem.answers.join("")}`);
            break;
          }
          case 4: {
            lines.push(...problem.blanks.map(({ answers }, i) => `答案 ${i + 1}：${JSON.stringify(answers)}`));
            break;
          }
          default:
            lines.push("无答案");
            break;
        }
        alert(lines.join("\n"));
      }
      function toggleAutoAnswer() {
        config.autoAnswer = !config.autoAnswer;
        $toast({
          message: `自动作答：${config.autoAnswer ? "开" : "关"}`,
          duration: 1500
        });
      }
      function toggleProblemUI() {
        problemUIVisible.value = !problemUIVisible.value;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("div", _hoisted_1, [
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["btn", { disabled: !lastProblem.value }]),
              title: "查看习题答案",
              onClick: _cache[0] || (_cache[0] = ($event) => revealAnswers(lastProblem.value))
            }, _hoisted_3, 2),
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["btn", { active: config.autoAnswer }]),
              title: "切换自动作答",
              onClick: _cache[1] || (_cache[1] = ($event) => toggleAutoAnswer())
            }, _hoisted_5, 2),
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["btn", { active: problemUIVisible.value }]),
              title: "显示习题列表",
              onClick: _cache[2] || (_cache[2] = ($event) => toggleProblemUI())
            }, _hoisted_7, 2)
          ]),
          vue.withDirectives(vue.createVNode(ProblemUI, {
            config,
            presentations,
            "problem-status": problemStatus,
            onAnswerProblem
          }, null, 8, ["config", "presentations", "problem-status"]), [
            [vue.vShow, problemUIVisible.value]
          ])
        ], 64);
      };
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1c8fbbdf"]]);
  const url = new URL(window.location.href);
  if (url.pathname.startsWith("/lesson/fullscreen/v3/")) {
    launchLessonHelper();
  } else if (url.pathname.startsWith("/v2/web/")) {
    pollActiveLessons();
  }
  function launchLessonHelper() {
    _GM_getTab((tab) => {
      tab.type = "lesson";
      tab.lessonId = url.pathname.split("/")[4];
      _GM_saveTab(tab);
    });
    vue.createApp(App).mount(
      (() => {
        const app = document.createElement("div");
        document.body.append(app);
        return app;
      })()
    );
  }
  function pollActiveLessons() {
    const enteredLessonIds = /* @__PURE__ */ new Set();
    function updateLessonIds() {
      return new Promise((resolve) => {
        _GM_getTabs((tabs) => {
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
      const resp = await getActiveLessons();
      if (resp.code !== 0) {
        throw new Error("Failed to get active lessons: " + resp.msg);
      }
      for (const lesson of resp.data.onLessonClassrooms) {
        const { classroomId, lessonId } = lesson;
        if (!enteredLessonIds.has(lessonId)) {
          _GM_openInTab("https://pro.yuketang.cn/lesson/fullscreen/v3/" + lessonId);
          enteredLessonIds.add(lessonId);
        }
      }
    }
    updateLessonIds();
    setInterval(async () => {
      await updateLessonIds();
      await checkActiveLessons();
    }, 5e3);
  }
  _unsafeWindow.WebSocket = MyWebSocket;
  _unsafeWindow.XMLHttpRequest = MyXMLHttpRequest;
  _unsafeWindow.yktStorage = storage;
  _unsafeWindow.yktAPI = API;

})(Vue, jspdf);