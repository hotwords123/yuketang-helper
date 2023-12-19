<script setup>
import { ref, reactive, watch, computed } from 'vue';
import storage from './storage';
import { answerProblem } from './api';
import { MyWebSocket, MyXMLHttpRequest } from './network';
import { randInt, shuffleArray, sleep } from './util';
import ProblemUI from './components/ProblemUI.vue';

// #region App state
const DEFAULT_CONFIG = {
  autoAnswer: false,
  autoAnswerDelay: [3 * 1000, 6 * 1000],
  maxPresentations: 5,
};

const config = reactive(storage.get("config", DEFAULT_CONFIG));
watch(config, (value) => storage.set("config", value));

const presentations = reactive(new Map());
const slides = reactive(new Map());
const problems = reactive(new Map());
const unlockedProblemIds = reactive(new Set());
const lastProblem = ref(null);
// #endregion

// #region WebSocket messages
const messagesReceived = [];
const messagesSent = [];

MyWebSocket.addHandler((ws, url) => {
  if (url === "wss://pro.yuketang.cn/wsapp/") {
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
  if (unlockedProblemIds.has(data.prob)) return;
  unlockedProblemIds.add(data.prob);

  // Skip if problem has expired
  const endTime = data.dt + 1000 * data.limit;
  if (Date.now() > endTime) return;

  const problem = problems.get(data.prob);
  const slide = slides.get(data.sid);
  if (!problem || !slide) return;

  // Skip if problem has been answered
  if (problem.result) return;

  lastProblem.value = problem;
  notifyProblem(problem, slide);

  if (config.autoAnswer) {
    doAutoAnswer(problem);
  }
}

function onLessonFinished() {
  const notification = new Notification("下课提示", {
    body: "当前课程已结束",
    tag: "lesson-finished-notice"
  });

  notification.addEventListener("error", (evt) => {
    console.error(evt);
  });
}
// #endregion

// #region XMLHttpRequest responses
MyXMLHttpRequest.addHandler((xhr, method, url) => {
  if (url.pathname === "/api/v3/lesson/presentation/fetch") {
    xhr.intercept((resp) => {
      const id = url.searchParams.get("presentation_id");
      onPresentationLoaded(id, resp);
    });
  }

  if (url.pathname === "/api/v3/lesson/redenvelope/issue-list") {
    xhr.intercept((resp) => {
      const id = url.searchParams.get("redEnvelopeId");
      onRedEnvelopeListLoaded(id, resp);
    });
  }

  if (url.pathname === "/api/v3/lesson/problem/answer") {
    xhr.intercept((resp, payload) => {
      const { problemId, result } = JSON.parse(payload);
      onAnswerProblem(problemId, result, resp);
    });
  }
});

function onPresentationLoaded(id, resp) {
  if (resp.code !== 0) {
    throw new Error(`Failed to load presentation ${id}: ${resp.msg}`);
  }

  const presentation = resp.data;
  presentation.id = id;
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
    map.set(id, presentation);

    const excess = map.size - config.maxPresentations;
    if (excess > 0) {
      const keys = [...map.keys()].slice(0, excess);
      for (const key of keys) {
        map.delete(key);
      }
    }
  });
}

function onRedEnvelopeListLoaded(id, result) {
  if (result.code === 0) {
    storage.alterMap("red-envelopes", map => map.set(id, result.data));
  } else {
    console.log(`Failed to load red envelope list: ${result.msg} (${result.code})`);
  }
}

function onAnswerProblem(problemId, result, data) {
  if (data.code !== 0) return;

  const problem = problems.get(problemId);
  if (problem) {
    problem.result = result;
  }
}
// #endregion

// #region Problem notification
function notifyProblem(problem, slide) {
  const notification = new Notification("课堂习题提示", {
    body: getProblemDetail(problem),
    image: slide?.thumbnail,
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

    const notification = new Notification("自动作答提示", {
      body: messages.join("\n"),
      tag: "problem-auto-answer",
      renotify: true
    });

    notification.addEventListener("error", (evt) => {
      console.error(evt);
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
const PROBLEM_TYPE_MAP = {
  1: "单选题", 2: "多选题", 3: "投票题", 4: "填空题", 5: "主观题"
};

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

window.debugHelper = () => {
  const presentations = storage.getMap("presentations");
  for (const [id, presentation] of presentations) {
    onPresentationLoaded(id, { code: 0, data: presentation });
  }
};
</script>

<template>
  <div class="toolbar">
    <span class="btn" title="查看习题答案"
      :class="{ disabled: !lastProblem }"
      @click="revealAnswers(lastProblem)"
    >
      <i class="fas fa-eye fa-lg"></i>
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
  <ProblemUI
    v-show="problemUIVisible"
    :presentations="presentations"
    :unlocked-problem-ids="unlockedProblemIds"
    @reveal-answers="revealAnswers"
  />
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

.toolbar>.btn {
  display: inline-block;
  padding: 4px;
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
</style>
