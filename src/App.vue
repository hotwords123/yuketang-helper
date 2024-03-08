<script setup>
import { ref, reactive, computed, watch, Transition, TransitionGroup } from 'vue';
import { GM_notification, unsafeWindow } from '$';
import storage from './storage';
import { answerProblem, retryProblem } from './api';
import { MyWebSocket, MyXMLHttpRequest } from './network';
import { randInt, shuffleArray, coverStyle } from './util';
import ProblemUI from './components/problem-ui/ProblemUI.vue';
import ActiveProblem from './components/ActiveProblem.vue';

// #region App state
const DEFAULT_CONFIG = {
  notifyProblems: "always",
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
  const problem = problems.get(data.prob);
  const slide = slides.get(data.sid);
  if (!problem || !slide) return;

  const status = {
    presentationId: data.pres,
    slideId: data.sid,
    startTime: data.dt,
    endTime: data.dt + 1000 * data.limit,
    done: !!problem.result,
    autoAnswerTime: null,
    answering: false,
  };
  problemStatus.set(data.prob, status);

  // Skip if problem has expired
  if (Date.now() > status.endTime) return;

  // Skip if problem has been answered
  if (problem.result) return;

  if (config.notifyProblems && (config.notifyProblems !== "background" || document.hidden)) {
    notifyProblem(problem, slide);
  }

  if (config.autoAnswer) {
    if (getAnswerToProblem(problem)) {
      const now = Date.now();
      status.autoAnswerTime = Math.min(status.endTime - 5000, now + randInt(...config.autoAnswerDelay));

      $toast({
        message: `将在 ${Math.floor(Math.max(0, status.autoAnswerTime - now) / 1000)} 秒后自动作答本题`,
        duration: 3000
      });
    } else {
      $toast({
        message: "未指定提交内容，无法自动作答本题",
        duration: 3000
      });
    }
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
    setTimeout(() => {
      const status = problemStatus.get(problemId);
      if (status) {
        status.done = true;
      }
    }, 5000);
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

  GM_notification({
    title: "自动作答提示",
    text: messages.join("\n"),
    tag: "problem-auto-answer",
    silent: true,
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
// #endregion

// #region Problem UI
const currentPresentationId = ref(null);
const currentSlideId = ref(null);

function navigate(presentationId, slideId) {
  problemUIVisible.value = true;
  currentPresentationId.value = presentationId;
  currentSlideId.value = slideId;
}

async function handleRetry(problem, result) {
  const { problemId } = problem;

  if (!confirm("此功能用于补救超时未作答的题目，是否继续？")) {
    $toast({
      message: "已取消重试作答",
      duration: 1500
    });
    return;
  }

  if (!result) {
    result = getAnswerToProblem(problem);
    if (!result) {
      $toast({
        message: "未指定提交内容，无法重试作答",
        duration: 3000
      });
      return;
    }

    if (!confirm("未指定提交内容，是否使用默认答案？\n答案：" + JSON.stringify(result))) {
      $toast({
        message: "已取消重试作答",
        duration: 1500
      });
      return;
    }
  }

  try {
    const status = problemStatus.get(problemId);
    const dt = status.startTime + randInt(...config.autoAnswerDelay);

    const resp = await retryProblem(problem, result, dt);

    if (resp.code !== 0)
      throw new Error(`${resp.msg} (${resp.code})`);

    if (!resp.data.success.includes(problemId))
      throw new Error("服务器未返回成功信息");

    onAnswerProblem(problemId, result);

    $toast({
      message: "重试作答成功",
      duration: 3000
    });
  } catch (err) {
    console.error(err);
    $toast({
      message: "重试作答失败：" + err.message,
      duration: 3000
    });
  }
}
// #endregion

// #region Active problems
const activeProblems = computed(() => {
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
// #endregion

if (process.env.NODE_ENV === 'development') {
  unsafeWindow.debugHelper = () => {
    debugger;
    const presentations = storage.getMap("presentations");
    let count = 0;

    for (const [id, presentation] of presentations) {
      onPresentationLoaded(id, presentation);

      for (const slide of presentation.slides) {
        if (slide.problem && count < 8) {
          count++;
          onUnlockProblem({
            prob: slide.problem.problemId,
            pres: id,
            sid: slide.id,
            dt: Date.now() - Math.floor(Math.random() * 60) * 1000,
            limit: 60,
          });
        }
      }
    }
  };
}
</script>

<template>
  <div class="toolbar">
    <span class="icon-btn" title="切换习题提醒"
      :class="{ active: config.notifyProblems }"
      @click="toggleNotifyProblems()"
    >
      <i class="fa-bell fa-lg"
        :class="config.notifyProblems === 'background' ? 'far' : 'fas'"
      ></i>
    </span>
    <span class="icon-btn" title="切换自动作答"
      :class="{ active: config.autoAnswer }"
      @click="toggleAutoAnswer()"
    >
      <i class="fas fa-upload fa-lg"></i>
    </span>
    <span class="icon-btn" title="显示习题列表"
      :class="{ active: problemUIVisible }"
      @click="toggleProblemUI()"
    >
      <i class="fas fa-list-check fa-lg"></i>
    </span>
  </div>
  <TransitionGroup tag="ul" class="track" appear>
    <li v-for="{ problem, slide, presentation, status } in activeProblems"
      class="anchor"
      :key="problem.problemId"
    >
      <ActiveProblem class="inner"
        :problem="problem"
        :status="status"
        @show="navigate(status.presentationId, status.slideId)"
        @answer="doAutoAnswer(problem, status)"
        @retry="handleRetry(problem, null)"
        @cancel="cancelAutoAnswer(status)"
      >
        <img :src="slide.thumbnail" :style="{ height: '100%', ...coverStyle(presentation) }">
      </ActiveProblem>
    </li>
  </TransitionGroup>
  <Transition>
    <div class="popup" v-show="problemUIVisible">
      <ProblemUI class="problem-ui"
        :config="config"
        :presentations="presentations"
        :slides="slides"
        :current-presentation-id="currentPresentationId"
        :current-slide-id="currentSlideId"
        :problem-status="problemStatus"
        @navigate="navigate"
        @retry-problem="handleRetry"
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

.track {
  position: fixed;
  z-index: 100;
  bottom: 65px;
  left: 15px;
  display: flex;
  flex-direction: row;
}

.anchor {
  position: relative;
  width: 100px;
  list-style: none;
}

.inner {
  position: absolute;
  bottom: 0;
}

.anchor.v-move, .anchor.v-enter-active, .anchor.v-leave-active {
  transition: all 0.5s ease;
}

.anchor.v-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.anchor.v-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.anchor.v-leave-active {
  width: 0;
}

.popup {
  position: fixed;
  z-index: 200;
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
  transition: transform 0.2s ease;
}

.popup.v-enter-from>.problem-ui, .popup.v-leave-to>.problem-ui {
  transform: translateY(10px);
}
</style>
