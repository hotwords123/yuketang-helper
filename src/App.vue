<script setup>
import { ref, reactive, watch, Transition } from 'vue';
import { GM_notification, unsafeWindow } from '$';
import storage from './storage';
import { answerProblem } from './api';
import { MyWebSocket, MyXMLHttpRequest } from './network';
import { randInt, shuffleArray, PROBLEM_TYPE_MAP } from './util';
import ProblemUI from './components/ProblemUI.vue';

// #region App state
const DEFAULT_CONFIG = {
  notifyProblems: true,
  autoAnswer: false,
  autoAnswerDelay: [3 * 1000, 6 * 1000],
  maxPresentations: 5,
};

const config = reactive({
  ...DEFAULT_CONFIG,
  ...storage.get("config", DEFAULT_CONFIG),
});
watch(config, (value) => storage.set("config", value));
window.yktConfig = config;  // Expose to global scope for convenience

const presentations = reactive(new Map());
const slides = reactive(new Map());
const problems = reactive(new Map());
const problemStatus = reactive(new Map());
// #endregion

// #region WebSocket messages
const messagesReceived = [];
const messagesSent = [];

MyWebSocket.addHandler((ws, url) => {
  if (url.pathname === "/wsapp/") {
    ws.intercept((message) => {
      messagesSent.push(message);
    });

    ws.listen((message) => {
      messagesReceived.push(message);
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
  if (problemStatus.has(data.prob)) return;

  const status = {
    startTime: data.dt,
    endTime: data.dt + 1000 * data.limit,
  };
  problemStatus.set(data.prob, status);

  // Skip if problem has expired
  if (Date.now() > status.endTime) return;

  const problem = problems.get(data.prob);
  const slide = slides.get(data.sid);
  if (!problem || !slide) return;

  // Skip if problem has been answered
  if (problem.result) return;

  if (config.notifyProblems) {
    notifyProblem(problem, slide);
  }

  if (config.autoAnswer) {
    doAutoAnswer(problem);
  }
}

function onLessonFinished() {
  GM_notification({
    title: "下课提示",
    text: "当前课程已结束",
    tag: "lesson-finished",
    silent: true,
  });
}
// #endregion

// #region XMLHttpRequest responses
MyXMLHttpRequest.addHandler((xhr, method, url) => {
  if (url.pathname === "/api/v3/lesson/presentation/fetch") {
    xhr.intercept((resp) => {
      const id = url.searchParams.get("presentation_id");
      if (resp.code === 0) {
        onPresentationLoaded(id, resp.data);
      }
    });
  }

  if (url.pathname === "/api/v3/lesson/redenvelope/issue-list") {
    xhr.intercept((resp) => {
      const id = url.searchParams.get("redEnvelopeId");
      if (resp.code === 0) {
        onRedEnvelopeListLoaded(id, resp.data);
      }
    });
  }

  if (url.pathname === "/api/v3/lesson/problem/answer") {
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

  // Save presentation data in local storage
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
  storage.alterMap("red-envelopes", map => map.set(id, data));
}

function onAnswerProblem(problemId, result) {
  const problem = problems.get(problemId);
  if (problem) {
    problem.result = result;
  }
}
// #endregion

// #region Problem notification
function notifyProblem(problem, slide) {
  GM_notification({
    title: "课堂习题提示",
    text: getProblemDetail(problem),
    image: slide?.thumbnail,
    tag: "problem-notice",
    silent: false,
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
// #endregion

// #region Auto answer
const autoAnswerTimers = [];

window.addEventListener("keydown", (evt) => {
  if (evt.key === "F10") {
    if (autoAnswerTimers.length > 0) {
      const timer = autoAnswerTimers.shift();
      clearTimeout(timer);
      $toast({
        message: "已取消自动作答",
        duration: 3000
      });
    }
  }
});

function doAutoAnswer(problem) {
  const result = getAnswerToProblem(problem);
  if (!result) {
    $toast({
      message: "未指定提交内容，无法自动作答本题",
      duration: 3000
    });
    return;
  }

  const delay = randInt(...config.autoAnswerDelay);
  const timer = setTimeout(async () => {
    const index = autoAnswerTimers.indexOf(timer);
    if (index !== -1) autoAnswerTimers.splice(index, 1);

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

    GM_notification({
      title: "自动作答提示",
      text: messages.join("\n"),
      tag: "problem-auto-answer",
      silent: true,
    });
  }, delay);
  autoAnswerTimers.push(timer);

  $toast({
    message: `将在 ${Math.round(delay / 1000)} 秒后自动作答本题，按 F10 取消`,
    duration: 3000
  });
}

function getAnswerToProblem(problem) {
  const problemAnswers = storage.getMap("auto-answer");
  if (problemAnswers.has(problem.problemId))
    return problemAnswers.get(problem.problemId);

  switch (problem.problemType) {
    // Multiple-choice
    case 1:
    case 2:
      return problem.answers;

    // Vote
    case 3: {
      const choices = problem.options.map(option => option.key);
      const count = randInt(1, problem.pollingCount);
      return shuffleArray(choices).slice(0, count).sort();
    }

    // Fill-in-the-blank
    case 4:
      return problem.blanks.map(blank => blank.answers[0]);

    default:
      return null;
  }
}
// #endregion

// #region Helper toolbar

const problemUIVisible = ref(false);

function revealAnswers(problem) {
  const lines = [
    `类型：${PROBLEM_TYPE_MAP[problem.problemType] || "未知"}`,
    `题面：${problem.body || "无"}`,
  ];

  switch (problem.problemType) {
    // Multiple-choice
    case 1:
    case 2: {
      lines.push(`答案：${problem.answers.join("")}`);
      break;
    }

    // Fill-in-the-blank
    case 4: {
      lines.push(...problem.blanks.map((({ answers }, i) => `答案 ${i + 1}：${JSON.stringify(answers)}`)));
      break;
    }

    default:
      lines.push("无答案");
      break;
  }

  alert(lines.join("\n"));
}

function toggleNotifyProblems() {
  config.notifyProblems = !config.notifyProblems;
  $toast({
    message: `习题提醒：${config.notifyProblems ? "开" : "关"}`,
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
// #endregion

if (process.env.NODE_ENV === 'development') {
  unsafeWindow.debugHelper = () => {
    debugger;
    const presentations = storage.getMap("presentations");
    for (const [id, presentation] of presentations) {
      onPresentationLoaded(id, presentation);
    }
  };
}
</script>

<template>
  <div class="toolbar">
    <span class="btn" title="切换习题提醒"
      :class="{ active: config.notifyProblems }"
      @click="toggleNotifyProblems()"
    >
      <i class="fas fa-bell fa-lg"></i>
    </span>
    <span class="btn" title="切换自动作答"
      :class="{ active: config.autoAnswer }"
      @click="toggleAutoAnswer()"
    >
      <i class="fas fa-upload fa-lg"></i>
    </span>
    <span class="btn" title="显示习题列表"
      :class="{ active: problemUIVisible }"
      @click="toggleProblemUI()"
    >
      <i class="fas fa-list-check fa-lg"></i>
    </span>
  </div>
  <Transition>
    <div class="popup" v-show="problemUIVisible">
      <ProblemUI class="problem-ui"
        :config="config"
        :presentations="presentations"
        :problem-status="problemStatus"
        @answer-problem="onAnswerProblem"
      />
    </div>
  </Transition>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.toolbar {
  position: fixed;
  z-index: 2000001;
  left: 15px;
  bottom: 15px;
  width: 100px;
  height: 36px;
  padding: 5px 9px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cccccc;
  border-radius: 4px;
  box-shadow: 0 1px 4px 3px rgba(0, 0, 0, .1);
}

.toolbar>.btn {
  display: inline-block;
  width: 20px;
  text-align: center;
  cursor: pointer;
  color: #607190;
}

.toolbar>.btn:hover {
  color: #1e3050;
}

.toolbar>.btn.active {
  color: #1d63df;
}

.toolbar>.btn.active:hover {
  color: #1b53ac;
}

.toolbar>.btn.disabled {
  color: #bbbbbb;
  cursor: default;
}

.popup {
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

.popup.v-enter-active, .popup.v-leave-active {
  transition: opacity 0.2s;
}

.popup.v-enter-from, .popup.v-leave-to {
  opacity: 0;
}

.problem-ui {
  width: 80%;
  height: 90%;
}

.popup.v-enter-active>.problem-ui, .popup.v-leave-active>.problem-ui {
  transition: transform 0.2s ease-in-out;
}

.popup.v-enter-from>.problem-ui, .popup.v-leave-to>.problem-ui {
  transform: translateY(10px);
}
</style>
