// ==UserScript==
// @name         雨课堂 helper
// @namespace    https://github.com/hotwords123/yuketang-helper
// @version      1.6.0
// @author       hotwords123
// @description  雨课堂辅助工具：课堂习题提示，自动作答习题
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yuketang.cn
// @match        https://*.yuketang.cn/lesson/fullscreen/v3/*
// @match        https://*.yuketang.cn/v2/web/*
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.22/dist/vue.global.prod.js
// @require      https://cdn.jsdelivr.net/npm/jspdf@3.0.3/dist/jspdf.umd.min.js
// @grant        GM_addStyle
// @grant        GM_getTab
// @grant        GM_getTabs
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_saveTab
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function (vue, jspdf) {
  'use strict';

  const d=new Set;const importCSS = async e=>{d.has(e)||(d.add(e),(t=>{typeof GM_addStyle=="function"?GM_addStyle(t):document.head.appendChild(document.createElement("style")).append(t);})(e));};

  importCSS(' .title[data-v-a9820715]{font-weight:700;overflow:hidden;margin:10px 0}.title[data-v-a9820715]:after{content:"";display:inline-block;height:1px;background:#aaa;position:relative;vertical-align:middle;width:100%;left:1em;margin-right:-100%}.title .download-btn[data-v-a9820715]{cursor:pointer}.slide[data-v-a9820715]{position:relative;margin:10px 0;border:2px solid #dddddd;cursor:pointer}.slide>img[data-v-a9820715]{display:block;width:100%}.slide>.tag[data-v-a9820715]{position:absolute;top:0;left:0;display:inline-block;padding:3px 5px;font-size:small;color:#f7f7f7;background:#40404066}.slide.active[data-v-a9820715]{border-color:#2d70e7}.slide.active>.tag[data-v-a9820715]{background:#2d70e7}.slide.unlocked[data-v-a9820715]{border-color:#d7d48e}.slide.unlocked.active[data-v-a9820715]{border-color:#e6cb2d}.slide.unlocked.active>.tag[data-v-a9820715]{background:#e6cb2d}.slide.answered[data-v-a9820715]{border-color:#8dd790}.slide.answered.active[data-v-a9820715]{border-color:#4caf50}.slide.answered.active>.tag[data-v-a9820715]{background:#4caf50}.body[data-v-63a388c3]{margin-top:25px}.body>textarea[data-v-63a388c3]{width:100%;min-height:40px;resize:vertical}.actions[data-v-63a388c3]{margin-top:25px;text-align:center}.actions>button[data-v-63a388c3]{margin:0 20px;padding:4px 10px}.container[data-v-e971312a]{display:grid;grid-template:auto 36px / 240px auto;background:#ffffffe6;border:1px solid #bbbbbb;border-radius:5px;overflow:hidden}.list[data-v-e971312a]{grid-row:1;grid-column:1;padding:5px 15px;overflow-y:auto}.tail[data-v-e971312a]{grid-row:2;grid-column:1;padding:5px 15px;line-height:26px;border-top:1px solid #bbbbbb}.tail label[data-v-e971312a]{font-size:small}.tail input[type=checkbox][data-v-e971312a]{appearance:auto;vertical-align:middle}.detail[data-v-e971312a]{grid-row:1 / span 2;grid-column:2;padding:25px 40px;overflow-y:auto;border-left:1px solid #bbbbbb}.detail .cover[data-v-e971312a]{border:1px solid #dddddd;box-shadow:0 1px 4px 3px #0000001a}.detail .cover>img[data-v-e971312a]{display:block;width:100%}.card[data-v-250da923]{height:180px;background:#fff;border:1px solid #bbbbbb;box-shadow:0 1px 4px 3px #0000001a;opacity:.9;z-index:0;transition:all .2s ease}.card[data-v-250da923]:hover{box-shadow:0 1px 4px 3px #00000026;opacity:1;z-index:1;transform:translateY(-3px)}.tag[data-v-250da923]{position:absolute;bottom:0;left:0;display:inline-block;padding:2px 4px;font-size:small;color:#fff;background:#666c}.tag.ended[data-v-250da923]{background:#ff1e00cc}.tag.ready[data-v-250da923],.tag.pending[data-v-250da923]{background:#005effcc}.tag.answered[data-v-250da923]{background:#1eb41ecc}.tag>.icon-btn[data-v-250da923]{color:#eee}.tag>.icon-btn[data-v-250da923]:hover{color:#fff}.actions[data-v-250da923]{position:absolute;bottom:4px;right:5px;display:flex;flex-direction:row;gap:3px}.actions>.icon-btn[data-v-250da923]{list-style:none}[data-v-4aa66361]{margin:0;padding:0;box-sizing:border-box}.toolbar[data-v-4aa66361]{position:fixed;z-index:2000001;left:15px;bottom:15px;width:100px;height:36px;padding:5px 9px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;background:#fff;border:1px solid #cccccc;border-radius:4px;box-shadow:0 1px 4px 3px #0000001a}.track[data-v-4aa66361]{position:fixed;z-index:100;bottom:65px;left:15px;display:flex;flex-direction:row}.anchor[data-v-4aa66361]{position:relative;width:100px;list-style:none}.inner[data-v-4aa66361]{position:absolute;bottom:0}.anchor.v-move[data-v-4aa66361],.anchor.v-enter-active[data-v-4aa66361],.anchor.v-leave-active[data-v-4aa66361]{transition:all .5s ease}.anchor.v-enter-from[data-v-4aa66361]{opacity:0;transform:translateY(20px)}.anchor.v-leave-to[data-v-4aa66361]{opacity:0;transform:translateY(-20px)}.anchor.v-leave-active[data-v-4aa66361]{width:0}.popup[data-v-4aa66361]{position:fixed;z-index:200;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#40404066}.popup.v-enter-active[data-v-4aa66361],.popup.v-leave-active[data-v-4aa66361]{transition:opacity .2s}.popup.v-enter-from[data-v-4aa66361],.popup.v-leave-to[data-v-4aa66361]{opacity:0}.problem-ui[data-v-4aa66361]{width:80%;height:90%}.popup.v-enter-active>.problem-ui[data-v-4aa66361],.popup.v-leave-active>.problem-ui[data-v-4aa66361]{transition:transform .2s ease}.popup.v-enter-from>.problem-ui[data-v-4aa66361],.popup.v-leave-to>.problem-ui[data-v-4aa66361]{transform:translateY(10px)} ');

  var _GM_getTab = (() => typeof GM_getTab != "undefined" ? GM_getTab : void 0)();
  var _GM_getTabs = (() => typeof GM_getTabs != "undefined" ? GM_getTabs : void 0)();
  var _GM_notification = (() => typeof GM_notification != "undefined" ? GM_notification : void 0)();
  var _GM_openInTab = (() => typeof GM_openInTab != "undefined" ? GM_openInTab : void 0)();
  var _GM_saveTab = (() => typeof GM_saveTab != "undefined" ? GM_saveTab : void 0)();
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  const styleCss = '@import"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";:root{overflow:hidden}#watermark_layer{display:none!important;visibility:hidden!important}.icon-btn{display:inline-block;width:20px;text-align:center;cursor:pointer;color:#607190}.icon-btn:hover{color:#1e3050}.icon-btn.active{color:#1d63df}.icon-btn.active:hover{color:#1b53ac}.icon-btn.danger:hover{color:#e4231d}.icon-btn.disabled{color:#bbb!important;cursor:default}';
  importCSS(styleCss);
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
        return new Map();
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
    const url2 = new URL(path, location.origin);
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
    xtbz: "ykt",
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
        problems: [
          {
            problemId: problem.problemId,
            problemType: problem.problemType,
            dt,
            result
          }
        ]
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
  const API = Object.freeze( Object.defineProperty({
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
    static original = WebSocket;
    static handlers = [];
    static addHandler(handler) {
      this.handlers.push(handler);
    }
    constructor(url2, protocols) {
      super(url2, protocols);
      const parsed = new URL(url2, location.href);
      for (const handler of this.constructor.handlers) {
        handler(this, parsed);
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
  class MyXMLHttpRequest extends XMLHttpRequest {
    static original = XMLHttpRequest;
    static handlers = [];
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
  function coverStyle(presentation) {
    const { width, height } = presentation;
    return { aspectRatio: width + "/" + height };
  }
  const _hoisted_1$6 = ["src"];
  const _sfc_main$6 = {
    __name: "MemoizedImage",
    props: {
      src: {
        type: String,
        required: true
      }
    },
    setup(__props) {
      const props = __props;
      const cachedSrc = vue.ref("");
      vue.watch(
        () => props.src,
        (newSrc, oldSrc) => {
          if (shouldUpdate(newSrc, oldSrc)) {
            cachedSrc.value = newSrc;
          }
        },
        { immediate: true }
      );
      function shouldUpdate(newSrc, oldSrc) {
        if (!newSrc || !oldSrc) {
          return true;
        }
        try {
          const newUrl = new URL(newSrc, window.location.href);
          const oldUrl = new URL(oldSrc, window.location.href);
          if (newUrl.origin !== oldUrl.origin || newUrl.pathname !== oldUrl.pathname) {
            return true;
          }
          const newParams = newUrl.searchParams;
          const oldParams = oldUrl.searchParams;
          const allKeys = new Set([...newParams.keys(), ...oldParams.keys()]);
          allKeys.delete("e");
          allKeys.delete("token");
          for (const key of allKeys) {
            if (newParams.get(key) !== oldParams.get(key)) {
              return true;
            }
          }
        } catch (e) {
          return true;
        }
        return false;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("img", vue.mergeProps({ src: cachedSrc.value }, _ctx.$attrs), null, 16, _hoisted_1$6);
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
  const _hoisted_1$5 = { class: "title" };
  const _hoisted_2$5 = {
    key: 0,
    title: "下载进度"
  };
  const _hoisted_3$4 = ["onClick"];
  const _hoisted_4$2 = { class: "tag" };
  const _sfc_main$5 = {
    __name: "PresentationView",
    props: [
      "presentation",
      "showAllSlides",
      "currentSlideId",
      "problemStatus",
      "onNavigate"
    ],
    setup(__props) {
      const props = __props;
      const thumbStyle = vue.computed(() => coverStyle(props.presentation));
      const filteredSlides = vue.computed(() => {
        const { slides } = props.presentation;
        return props.showAllSlides ? slides : slides.filter((slide) => slide.problem);
      });
      function slideClass(slide) {
        const problem = slide.problem;
        return {
          active: slide.id === props.currentSlideId,
          ...problem && {
            unlocked: props.problemStatus.has(problem.problemId),
            answered: !!problem.result
          }
        };
      }
      const slideRefs = new Map();
      vue.watch(
        () => props.currentSlideId,
        (id) => {
          const el = slideRefs.get(id);
          if (el) {
            requestAnimationFrame(() => {
              const containerBox = el.parentElement.getBoundingClientRect();
              const itemBox = el.getBoundingClientRect();
              if (itemBox.top < containerBox.top || itemBox.bottom > containerBox.bottom) {
                el.scrollIntoView({ block: "center", behavior: "smooth" });
              }
            });
          }
        }
      );
      const downloadProgress = vue.ref(null);
      async function handleDownload() {
        try {
          $toast({
            message: "正在下载课件，可能需要一些时间...",
            duration: 3e3
          });
          await savePresentation();
        } catch (err) {
          console.error(err);
          $toast({
            message: "下载失败：" + err.message,
            duration: 3e3
          });
        } finally {
          downloadProgress.value = null;
        }
      }
      async function savePresentation() {
        const { presentation } = props;
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
          downloadProgress.value = `${slide.index}/${presentation.slides.length}`;
          const resp = await fetch(slide.cover);
          const arrayBuffer = await resp.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          doc.addPage();
          doc.addImage(data, "PNG", 0, 0, width, height);
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
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("div", _hoisted_1$5, [
            vue.createTextVNode(vue.toDisplayString(props.presentation.title) + " ", 1),
            downloadProgress.value ? (vue.openBlock(), vue.createElementBlock("span", _hoisted_2$5, " (" + vue.toDisplayString(downloadProgress.value) + ") ", 1)) : (vue.openBlock(), vue.createElementBlock("i", {
              key: 1,
              class: "download-btn fas fa-download",
              onClick: _cache[0] || (_cache[0] = ($event) => handleDownload())
            }))
          ]),
          (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(filteredSlides.value, (slide) => {
            return vue.openBlock(), vue.createElementBlock("div", {
              class: vue.normalizeClass(["slide", slideClass(slide)]),
              key: slide.id,
              ref_for: true,
              ref: (el) => vue.unref(slideRefs).set(slide.id, el),
              onClick: ($event) => props.onNavigate?.(props.presentation.id, slide.id)
            }, [
              vue.createVNode(_sfc_main$6, {
                src: slide.thumbnail,
                style: vue.normalizeStyle(thumbStyle.value)
              }, null, 8, ["src", "style"]),
              vue.createElementVNode("span", _hoisted_4$2, vue.toDisplayString(slide.index), 1)
            ], 10, _hoisted_3$4);
          }), 128))
        ], 64);
      };
    }
  };
  const PresentationView = _export_sfc(_sfc_main$5, [["__scopeId", "data-v-a9820715"]]);
  const _hoisted_1$4 = { key: 0 };
  const _hoisted_2$4 = { key: 2 };
  const _sfc_main$4 = {
    __name: "AnswerReveal",
    props: ["problem", "revealed", "onReveal"],
    setup(__props) {
      const props = __props;
      return (_ctx, _cache) => {
        return !props.revealed ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_1$4, [
          _cache[1] || (_cache[1] = vue.createTextVNode(" 答案：", -1)),
          vue.createElementVNode("a", {
            href: "#",
            onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => props.onReveal?.(), ["prevent"]))
          }, "查看答案")
        ])) : props.problem.problemType === 4 ? (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 1 }, vue.renderList(props.problem.blanks, (blank, key) => {
          return vue.openBlock(), vue.createElementBlock("p", null, [
            vue.createTextVNode(" 答案 " + vue.toDisplayString(key + 1) + "：", 1),
            vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(blank.answers)), 1)
          ]);
        }), 256)) : (vue.openBlock(), vue.createElementBlock("p", _hoisted_2$4, [
          _cache[2] || (_cache[2] = vue.createTextVNode(" 答案：", -1)),
          vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(props.problem.answers)), 1)
        ]));
      };
    }
  };
  const _hoisted_1$3 = { class: "body" };
  const _hoisted_2$3 = { key: 1 };
  const _hoisted_3$3 = { key: 2 };
  const _hoisted_4$1 = ["src"];
  const _hoisted_5$1 = { key: 3 };
  const _hoisted_6$1 = ["placeholder"];
  const _hoisted_7 = {
    key: 0,
    class: "actions"
  };
  const _hoisted_8 = ["disabled"];
  const _sfc_main$3 = {
    __name: "ProblemView",
    props: ["problem", "canAnswer", "onAnswer"],
    setup(__props) {
      const props = __props;
      const answerRevealed = vue.ref(false);
      const answerContent = vue.ref("");
      const hasAnswer = vue.computed(() => {
        const { problem } = props;
        switch (problem.problemType) {
          case 1:
          case 2:
            return Array.isArray(problem.answers) && problem.answers.length > 0;
          case 4:
            return problem.blanks.some(
              (blank) => Array.isArray(blank.answers) && blank.answers.length > 0
            );
          default:
            return false;
        }
      });
      const answerPrompt = vue.computed(() => {
        switch (props.problem.problemType) {
          case 1:
            return "单选题：输入选项字母，如 A";
          case 2:
            return "多选题：输入所有选项字母，如 ACD";
          case 3:
            return "投票题：输入所有选项字母，如 ACD";
          case 4:
            return "填空题：每行输入一个空的答案，空行会被自动忽略";
          case 5:
            return "问答题：直接输入作答内容，暂时不支持图片上传";
          default:
            return "未知题目类型";
        }
      });
      const answerPlaceholder = vue.computed(
        () => `在此处输入自动作答内容
${answerPrompt.value}`
      );
      vue.onActivated(() => {
        const { problemId, problemType } = props.problem;
        const problemAnswers = storage.getMap("auto-answer");
        const result = problemAnswers.get(problemId);
        answerContent.value = "";
        if (result) {
          switch (problemType) {
            case 1:
            case 2:
            case 3:
              if (Array.isArray(result)) answerContent.value = result.join("");
              break;
            case 4:
              if (Array.isArray(result)) answerContent.value = result.join("\n");
              break;
            case 5:
              if (result && typeof result.content === "string")
                answerContent.value = result.content;
              break;
          }
        }
      });
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
        const { problemId, problemType } = props.problem;
        const content = answerContent.value;
        if (!content) {
          storage.alterMap("auto-answer", (map) => map.delete(problemId));
          $toast({
            message: "已重置本题的自动作答内容",
            duration: 3e3
          });
        } else {
          const result = parseAnswer(problemType, content);
          storage.alterMap("auto-answer", (map) => map.set(problemId, result));
          $toast({
            message: "已设置本题的自动作答内容",
            duration: 3e3
          });
        }
      }
      function handleAnswer() {
        const content = answerContent.value;
        const { problemType } = props.problem;
        props.onAnswer?.(content && parseAnswer(problemType, content));
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("div", _hoisted_1$3, [
            vue.createElementVNode("p", null, "题面：" + vue.toDisplayString(props.problem.body || "空"), 1),
            hasAnswer.value ? (vue.openBlock(), vue.createBlock(_sfc_main$4, {
              key: 0,
              problem: props.problem,
              revealed: answerRevealed.value || !!props.problem.result,
              onReveal: _cache[0] || (_cache[0] = ($event) => answerRevealed.value = true)
            }, null, 8, ["problem", "revealed"])) : vue.createCommentVNode("", true),
            props.problem.remark ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_2$3, "备注：" + vue.toDisplayString(props.problem.remark), 1)) : vue.createCommentVNode("", true),
            Array.isArray(props.problem.remarkRich?.shapes) ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_3$3, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(props.problem.remarkRich.shapes, (shape) => {
                return vue.openBlock(), vue.createElementBlock("img", {
                  key: shape.id,
                  src: shape.url
                }, null, 8, _hoisted_4$1);
              }), 128))
            ])) : vue.createCommentVNode("", true),
            props.problem.result ? (vue.openBlock(), vue.createElementBlock("p", _hoisted_5$1, [
              _cache[4] || (_cache[4] = vue.createTextVNode(" 作答内容：", -1)),
              vue.createElementVNode("code", null, vue.toDisplayString(JSON.stringify(props.problem.result)), 1)
            ])) : vue.withDirectives((vue.openBlock(), vue.createElementBlock("textarea", {
              key: 4,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => answerContent.value = $event),
              placeholder: answerPlaceholder.value,
              rows: "6"
            }, null, 8, _hoisted_6$1)), [
              [vue.vModelText, answerContent.value]
            ])
          ]),
          !props.problem.result ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_7, [
            vue.createElementVNode("button", {
              onClick: _cache[2] || (_cache[2] = ($event) => updateAutoAnswer())
            }, "自动作答"),
            vue.createElementVNode("button", {
              disabled: !props.canAnswer,
              onClick: _cache[3] || (_cache[3] = ($event) => handleAnswer())
            }, " 提交答案 ", 8, _hoisted_8)
          ])) : vue.createCommentVNode("", true)
        ], 64);
      };
    }
  };
  const ProblemView = _export_sfc(_sfc_main$3, [["__scopeId", "data-v-63a388c3"]]);
  const _hoisted_1$2 = { class: "container" };
  const _hoisted_2$2 = { class: "list" };
  const _hoisted_3$2 = { class: "tail" };
  const _hoisted_4 = { class: "detail" };
  const _hoisted_5 = { class: "cover" };
  const _hoisted_6 = ["src"];
  const _sfc_main$2 = {
    __name: "ProblemUI",
    props: [
      "config",
      "presentations",
      "slides",
      "currentPresentationId",
      "currentSlideId",
      "problemStatus",
      "onNavigate",
      "onAnswerProblem"
    ],
    setup(__props) {
      const props = __props;
      const currentPresentation = vue.computed(
        () => props.currentPresentationId && props.presentations.get(props.currentPresentationId)
      );
      const currentSlide = vue.computed(
        () => props.currentSlideId && props.slides.get(props.currentSlideId)
      );
      const currentProblem = vue.computed(() => currentSlide.value?.problem);
      const showAllSlides = vue.ref(false);
      function canAnswerProblem(problem) {
        const status = props.problemStatus.get(problem.problemId);
        return status && !problem.result && !status.answering;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$2, [
          vue.createElementVNode("div", _hoisted_2$2, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(__props.presentations.values(), (presentation) => {
              return vue.openBlock(), vue.createBlock(PresentationView, {
                key: presentation.id,
                presentation,
                "show-all-slides": showAllSlides.value,
                currentSlideId: props.currentSlideId,
                "problem-status": props.problemStatus,
                onNavigate: props.onNavigate
              }, null, 8, ["presentation", "show-all-slides", "currentSlideId", "problem-status", "onNavigate"]);
            }), 128))
          ]),
          vue.createElementVNode("div", _hoisted_3$2, [
            vue.createElementVNode("label", null, [
              vue.withDirectives(vue.createElementVNode("input", {
                type: "checkbox",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => showAllSlides.value = $event)
              }, null, 512), [
                [vue.vModelCheckbox, showAllSlides.value]
              ]),
              _cache[2] || (_cache[2] = vue.createTextVNode(" 显示全部页面 ", -1))
            ])
          ]),
          vue.createElementVNode("div", _hoisted_4, [
            currentSlide.value ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
              vue.createElementVNode("div", _hoisted_5, [
                (vue.openBlock(), vue.createElementBlock("img", {
                  key: currentSlide.value.id,
                  src: currentSlide.value.cover,
                  style: vue.normalizeStyle(vue.unref(coverStyle)(currentPresentation.value))
                }, null, 12, _hoisted_6))
              ]),
              (vue.openBlock(), vue.createBlock(vue.KeepAlive, { max: 10 }, [
                currentProblem.value ? (vue.openBlock(), vue.createBlock(ProblemView, {
                  key: currentProblem.value.problemId,
                  problem: currentProblem.value,
                  "can-answer": canAnswerProblem(currentProblem.value),
                  onAnswer: _cache[1] || (_cache[1] = (result) => props.onAnswerProblem?.(currentProblem.value, result))
                }, null, 8, ["problem", "can-answer"])) : vue.createCommentVNode("", true)
              ], 1024))
            ], 64)) : vue.createCommentVNode("", true)
          ])
        ]);
      };
    }
  };
  const ProblemUI = _export_sfc(_sfc_main$2, [["__scopeId", "data-v-e971312a"]]);
  const _hoisted_1$1 = { class: "card" };
  const _hoisted_2$1 = { class: "actions bottom" };
  const _hoisted_3$1 = ["title"];
  const _sfc_main$1 = {
    __name: "ActiveProblem",
    props: [
      "problem",
      "status",
      "onShow",
      "onAnswer",
      "onCancel",
      "onDone"
    ],
    setup(__props) {
      const props = __props;
      const currentTime = vue.ref(Date.now());
      setInterval(() => {
        currentTime.value = Date.now();
      }, 500);
      const state = vue.computed(() => {
        if (props.problem.result) {
          return "answered";
        } else if (props.status.autoAnswerTime !== null) {
          return "ready";
        } else if (props.status.answering) {
          return "pending";
        } else if (currentTime.value >= props.status.endTime) {
          return "ended";
        } else {
          return "none";
        }
      });
      const canAnswer = vue.computed(
        () => !["answered", "pending"].includes(state.value)
      );
      const answerBtnTitle = vue.computed(() => {
        if (state.value === "ended") {
          return "重试作答";
        } else if (state.value === "ready") {
          return "立即作答";
        } else {
          return "自动作答";
        }
      });
      const tagText = vue.computed(() => {
        switch (state.value) {
          case "answered": {
            return "已完成";
          }
          case "ready": {
            const ms = Math.max(0, props.status.autoAnswerTime - currentTime.value);
            return `${Math.floor(ms / 1e3)} 秒后作答`;
          }
          case "pending": {
            return "作答中...";
          }
          case "ended": {
            return "已截止";
          }
          default: {
            const ms = Math.max(0, props.status.endTime - currentTime.value);
            const seconds = Math.floor(ms / 1e3) % 60;
            const minutes = Math.floor(ms / 6e4);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
          }
        }
      });
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
            lines.push(
              ...problem.blanks.map(
                ({ answers }, i) => `答案 ${i + 1}：${JSON.stringify(answers)}`
              )
            );
            break;
          }
          default:
            lines.push("无答案");
            break;
        }
        alert(lines.join("\n"));
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
          vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
          vue.createElementVNode("span", {
            class: vue.normalizeClass(["tag", state.value])
          }, [
            vue.createTextVNode(vue.toDisplayString(tagText.value), 1),
            state.value === "ready" ? (vue.openBlock(), vue.createElementBlock("span", {
              key: 0,
              class: "icon-btn",
              title: "取消作答",
              onClick: _cache[0] || (_cache[0] = ($event) => props.onCancel?.())
            }, [..._cache[5] || (_cache[5] = [
              vue.createElementVNode("i", { class: "fas fa-xmark" }, null, -1)
            ])])) : vue.createCommentVNode("", true),
            state.value === "answered" ? (vue.openBlock(), vue.createElementBlock("span", {
              key: 1,
              class: "icon-btn",
              title: "关闭题目",
              onClick: _cache[1] || (_cache[1] = ($event) => props.onDone?.())
            }, [..._cache[6] || (_cache[6] = [
              vue.createElementVNode("i", { class: "fas fa-check" }, null, -1)
            ])])) : vue.createCommentVNode("", true)
          ], 2),
          vue.createElementVNode("ul", _hoisted_2$1, [
            vue.createElementVNode("li", null, [
              vue.createElementVNode("span", {
                class: "icon-btn",
                title: "查看答案",
                onClick: _cache[2] || (_cache[2] = ($event) => revealAnswers(props.problem))
              }, [..._cache[7] || (_cache[7] = [
                vue.createElementVNode("i", { class: "fas fa-eye" }, null, -1)
              ])])
            ]),
            vue.createElementVNode("li", null, [
              vue.createElementVNode("span", {
                class: "icon-btn",
                title: "查看题目",
                onClick: _cache[3] || (_cache[3] = ($event) => props.onShow?.())
              }, [..._cache[8] || (_cache[8] = [
                vue.createElementVNode("i", { class: "fas fa-up-right-from-square" }, null, -1)
              ])])
            ]),
            vue.createElementVNode("li", null, [
              vue.createElementVNode("span", {
                class: vue.normalizeClass(["icon-btn", { disabled: !canAnswer.value }]),
                title: answerBtnTitle.value,
                onClick: _cache[4] || (_cache[4] = ($event) => canAnswer.value && props.onAnswer?.())
              }, [..._cache[9] || (_cache[9] = [
                vue.createElementVNode("i", { class: "fas fa-pen" }, null, -1)
              ])], 10, _hoisted_3$1)
            ])
          ])
        ]);
      };
    }
  };
  const ActiveProblem = _export_sfc(_sfc_main$1, [["__scopeId", "data-v-250da923"]]);
  const _hoisted_1 = { class: "toolbar" };
  const _hoisted_2 = ["src"];
  const _hoisted_3 = { class: "popup" };
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      const DEFAULT_CONFIG = {
        notifyProblems: "always",
        autoAnswer: false,
        autoAnswerDelay: [3 * 1e3, 6 * 1e3],
        maxPresentations: 5
      };
      const config = vue.reactive({
        ...DEFAULT_CONFIG,
        ...storage.get("config", DEFAULT_CONFIG)
      });
      vue.watch(config, (value) => storage.set("config", value));
      _unsafeWindow.yktConfig = config;
      const presentations = vue.reactive( new Map());
      const slides = vue.reactive( new Map());
      const problems = vue.reactive( new Map());
      const problemStatus = vue.reactive( new Map());
      MyWebSocket.addHandler((ws, url2) => {
        if (url2.pathname === "/wsapp/") {
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
        const problem = problems.get(data.prob);
        const slide = slides.get(data.sid);
        if (!problem || !slide) return;
        const status = {
          presentationId: data.pres,
          slideId: data.sid,
          startTime: data.dt,
          endTime: data.dt + 1e3 * data.limit,
          done: !!problem.result && true,
          autoAnswerTime: null,
          answering: false
        };
        problemStatus.set(data.prob, status);
        if (Date.now() > status.endTime) return;
        if (problem.result) return;
        if (config.notifyProblems && (config.notifyProblems !== "background" || document.hidden)) {
          notifyProblem(problem, slide);
        }
        if (config.autoAnswer) {
          if (getAnswerToProblem(problem)) {
            const now = Date.now();
            status.autoAnswerTime = Math.min(
              status.endTime - 5e3,
              now + randInt(...config.autoAnswerDelay)
            );
            $toast({
              message: `将在 ${Math.floor(Math.max(0, status.autoAnswerTime - now) / 1e3)} 秒后自动作答本题`,
              duration: 3e3
            });
          } else {
            $toast({
              message: "未指定提交内容，无法自动作答本题",
              duration: 3e3
            });
          }
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
          image: slide?.thumbnail,
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
      setInterval(() => {
        const now = Date.now();
        for (const [problemId, status] of problemStatus) {
          if (status.autoAnswerTime !== null && now >= status.autoAnswerTime) {
            doAutoAnswer(problems.get(problemId), status);
          }
        }
      }, 500);
      async function doAutoAnswer(problem, status) {
        if (status.answering) return;
        status.autoAnswerTime = null;
        status.answering = true;
        const messages = [];
        try {
          const result = getAnswerToProblem(problem);
          if (!result) {
            throw new Error("未指定提交内容");
          }
          messages.push("内容：" + JSON.stringify(result));
          const resp = await answerProblem(problem, result);
          if (resp.code === 0) {
            messages.push("作答完成");
            onAnswerProblem(problem.problemId, result);
          } else {
            messages.push(`作答失败：${resp.msg} (${resp.code})`);
          }
        } catch (err) {
          console.error(err);
          messages.push(`作答失败：${err.message}`);
        } finally {
          status.answering = false;
        }
        _GM_notification({
          title: "自动作答提示",
          text: messages.join("\n"),
          tag: "problem-auto-answer",
          silent: true
        });
      }
      function cancelAutoAnswer(status) {
        status.autoAnswerTime = null;
        $toast({
          message: "已取消自动作答",
          duration: 1500
        });
      }
      function getAnswerToProblem(problem) {
        const problemAnswers = storage.getMap("auto-answer");
        if (problemAnswers.has(problem.problemId))
          return problemAnswers.get(problem.problemId);
        switch (problem.problemType) {
case 1:
          case 2:
            if (problem.answers.length === 0) {
              return null;
            }
            return problem.answers;
case 3: {
            return null;
          }
case 4:
            if (problem.blanks.length === 0 || problem.blanks.any((blank) => blank.answers.length === 0)) {
              return null;
            }
            return problem.blanks.map((blank) => blank.answers[0]);
          default:
            return null;
        }
      }
      const problemUIVisible = vue.ref(false);
      function toggleNotifyProblems() {
        let desc;
        if (!config.notifyProblems) {
          config.notifyProblems = "always";
          desc = "开";
        } else if (config.notifyProblems === "background") {
          config.notifyProblems = false;
          desc = "关";
        } else {
          config.notifyProblems = "background";
          desc = "仅后台";
        }
        $toast({
          message: `习题提醒：${desc}`,
          duration: 1500
        });
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
      const currentPresentationId = vue.ref(null);
      const currentSlideId = vue.ref(null);
      function navigate(presentationId, slideId) {
        problemUIVisible.value = true;
        currentPresentationId.value = presentationId;
        currentSlideId.value = slideId;
      }
      async function handleAnswer(problem, result) {
        const { problemId } = problem;
        const status = problemStatus.get(problemId);
        if (!status) {
          $toast({
            message: "题目未发布",
            duration: 3e3
          });
          return;
        }
        if (status.answering) {
          $toast({
            message: "作答中，请稍后再试",
            duration: 3e3
          });
          return;
        }
        result = result || getAnswerToProblem(problem);
        if (!result) {
          $toast({
            message: "未指定提交内容",
            duration: 3e3
          });
          return;
        }
        status.autoAnswerTime = null;
        status.answering = true;
        try {
          if (Date.now() >= status.endTime) {
            if (!confirm(
              "作答已经截止，是否重试作答？\n此功能用于补救超时未作答的题目。"
            )) {
              $toast({
                message: "已取消作答",
                duration: 1500
              });
              return;
            }
            const dt = status.startTime + randInt(...config.autoAnswerDelay);
            const resp = await retryProblem(problem, result, dt);
            if (resp.code !== 0) {
              throw new Error(`${resp.msg} (${resp.code})`);
            }
            if (!resp.data.success.includes(problemId)) {
              throw new Error("服务器未返回成功信息");
            }
          } else {
            const resp = await answerProblem(problem, result);
            if (resp.code !== 0) {
              throw new Error(`${resp.msg} (${resp.code})`);
            }
          }
          onAnswerProblem(problemId, result);
          $toast({
            message: "作答完成",
            duration: 3e3
          });
        } catch (err) {
          console.error(err);
          $toast({
            message: "作答失败：" + err.message,
            duration: 3e3
          });
        } finally {
          status.answering = false;
        }
      }
      const activeProblems = vue.computed(() => {
        const entries = [];
        for (const [problemId, status] of problemStatus) {
          if (!status.done) {
            const problem = problems.get(problemId);
            const presentation = presentations.get(status.presentationId);
            const slide = slides.get(status.slideId);
            entries.push({ problem, slide, presentation, status });
          }
        }
        return entries;
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createElementVNode("div", _hoisted_1, [
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["icon-btn", { active: config.notifyProblems }]),
              title: "切换习题提醒",
              onClick: _cache[0] || (_cache[0] = ($event) => toggleNotifyProblems())
            }, [
              vue.createElementVNode("i", {
                class: vue.normalizeClass(["fa-bell fa-lg", config.notifyProblems === "background" ? "far" : "fas"])
              }, null, 2)
            ], 2),
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["icon-btn", { active: config.autoAnswer }]),
              title: "切换自动作答",
              onClick: _cache[1] || (_cache[1] = ($event) => toggleAutoAnswer())
            }, [..._cache[3] || (_cache[3] = [
              vue.createElementVNode("i", { class: "fas fa-upload fa-lg" }, null, -1)
            ])], 2),
            vue.createElementVNode("span", {
              class: vue.normalizeClass(["icon-btn", { active: problemUIVisible.value }]),
              title: "显示习题列表",
              onClick: _cache[2] || (_cache[2] = ($event) => toggleProblemUI())
            }, [..._cache[4] || (_cache[4] = [
              vue.createElementVNode("i", { class: "fas fa-list-check fa-lg" }, null, -1)
            ])], 2)
          ]),
          vue.createVNode(vue.TransitionGroup, {
            tag: "ul",
            class: "track",
            appear: ""
          }, {
            default: vue.withCtx(() => [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(activeProblems.value, ({ problem, slide, presentation, status }) => {
                return vue.openBlock(), vue.createElementBlock("li", {
                  class: "anchor",
                  key: problem.problemId
                }, [
                  vue.createVNode(ActiveProblem, {
                    class: "inner",
                    problem,
                    status,
                    onShow: ($event) => navigate(status.presentationId, status.slideId),
                    onAnswer: ($event) => handleAnswer(problem),
                    onCancel: ($event) => cancelAutoAnswer(status),
                    onDone: ($event) => status.done = true
                  }, {
                    default: vue.withCtx(() => [
                      vue.createElementVNode("img", {
                        src: slide.thumbnail,
                        style: vue.normalizeStyle({ height: "100%", ...vue.unref(coverStyle)(presentation) })
                      }, null, 12, _hoisted_2)
                    ]),
                    _: 2
                  }, 1032, ["problem", "status", "onShow", "onAnswer", "onCancel", "onDone"])
                ]);
              }), 128))
            ]),
            _: 1
          }),
          vue.createVNode(vue.Transition, null, {
            default: vue.withCtx(() => [
              vue.withDirectives(vue.createElementVNode("div", _hoisted_3, [
                vue.createVNode(ProblemUI, {
                  class: "problem-ui",
                  config,
                  presentations,
                  slides,
                  "current-presentation-id": currentPresentationId.value,
                  "current-slide-id": currentSlideId.value,
                  "problem-status": problemStatus,
                  onNavigate: navigate,
                  onAnswerProblem: handleAnswer
                }, null, 8, ["config", "presentations", "slides", "current-presentation-id", "current-slide-id", "problem-status"])
              ], 512), [
                [vue.vShow, problemUIVisible.value]
              ])
            ]),
            _: 1
          })
        ], 64);
      };
    }
  };
  const App = _export_sfc(_sfc_main, [["__scopeId", "data-v-4aa66361"]]);
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
    const run = () => {
      const el = document.createElement("div");
      document.body.append(el);
      vue.createApp(App).mount(el);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  }
  function pollActiveLessons() {
    const enteredLessonIds = new Set();
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
          const url2 = new URL(
            `/lesson/fullscreen/v3/${lessonId}`,
            location.origin
          );
          _GM_openInTab(url2.href, { active: false });
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