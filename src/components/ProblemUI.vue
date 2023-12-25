<script setup>
import { ref, computed, reactive } from "vue";
import { jsPDF } from "jspdf";
import storage from "../storage";
import { randInt, loadImage, PROBLEM_TYPE_MAP } from "../util";
import { retryProblem } from "../api";
import AnswerReveal from "./AnswerReveal.vue";

const props = defineProps([
  "config",
  "presentations",
  "problemStatus",
  "onAnswerProblem",
]);

const showAllSlides = ref(false);
const currentPresentation = ref(null);
const currentSlide = ref(null);
const currentProblem = computed(() => currentSlide.value?.problem);
const answerContent = ref("");

const filteredPresentations = computed(() => {
  return [...props.presentations.values()].map(({ slides, ...more }) => ({
    slides: slides.filter(slide => showAllSlides.value || slide.problem),
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
  return { aspectRatio: width + '/' + height };
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
      case 1: case 2: case 3:
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

const revealedProblemIds = reactive(new Set());

function answerRevealed(problem) {
  return problem.result || revealedProblemIds.has(problem.problemId);
}

function revealAnswer(problem) {
  revealedProblemIds.add(problem.problemId);
}

function parseAnswer(problemType, content) {
  switch (problemType) {
    case 1: case 2: case 3:
      return content.split("").sort();

    case 4:
      return content.split("\n").filter(text => !!text);

    case 5:
      // { content: string, pics: { pic: string, thumb: string }[] }
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
      duration: 3000
    });
  } else {
    const result = parseAnswer(problem.problemType, content);
    storage.alterMap("auto-answer", (map) => map.set(problem.problemId, result));

    $toast({
      message: "已设置本题的自动作答内容",
      duration: 3000
    });
  }
}

function canRetry(problem) {
  return props.problemStatus.has(problem.problemId) && !problem.result;
}

async function handleRetry(problem) {
  const content = answerContent.value;
  if (!content) {
    $toast({
      message: "作答内容不能为空",
      duration: 3000
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

    props.onAnswerProblem?.(problem, result);

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

async function handleDownload(presentationId) {
  try {
    const presentation = props.presentations.get(presentationId);
    $toast({
      message: "正在下载课件，可能需要一些时间...",
      duration: 3000
    });
    await savePresentation(presentation);
  } catch (err) {
    console.error(err);
    $toast({
      message: "下载失败：" + err.message,
      duration: 3000
    });
  }
}

async function savePresentation(presentation) {
  const { width, height } = presentation;

  const doc = new jsPDF({
    format: [width, height],
    orientation: width > height ? "l" : "p",
    unit: 'px',
    putOnlyUsedFonts: true,
    compress: true,
    hotfixes: ["px_scaling"],
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
</script>

<template>
  <div class="container">
    <div class="popup">
      <div class="list">
        <template v-for="presentation in filteredPresentations" :key="presentation.id">
          <div class="title">
            {{ presentation.title }}
            <i class="download-btn fas fa-download" @click="handleDownload(presentation.id)"></i>
          </div>
          <div class="slide"
            v-for="slide in presentation.slides"
            :key="slide.id"
            :class="slideClass(slide)"
            @click="setCurrentSlide(slide, presentation)"
          >
            <img :src="slide.thumbnail" :style="coverStyle(presentation)" />
            <span class="tag">{{ slide.index }}</span>
          </div>
        </template>
      </div>
      <div class="tail">
        <label>
          <input type="checkbox" v-model="showAllSlides">
          显示全部页面
        </label>
      </div>
      <div class="detail">
        <template v-if="currentSlide">
          <div class="cover">
            <img :key="currentSlide.id" :src="currentSlide.cover" :style="coverStyle(currentPresentation)">
          </div>
          <template v-if="currentProblem">
            <div class="body">
              <p>
                题面：{{ currentProblem.body || "空" }}
              </p>
              <AnswerReveal
                v-if="[1, 2, 4].includes(currentProblem.problemType)"
                :problem="currentProblem"
                :revealed="answerRevealed(currentProblem)"
                @reveal="revealAnswer(currentProblem)"
              />
              <p v-if="currentProblem.result">
                作答内容：<code>{{ JSON.stringify(currentProblem.result) }}</code>
              </p>
              <textarea v-model="answerContent" rows="6" placeholder="自动作答内容"></textarea>
            </div>
            <div class="actions">
              <button @click="updateAutoAnswer()">自动作答</button>
              <button :disabled="!canRetry(currentProblem)" @click="handleRetry(currentProblem)">重试作答</button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
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

.popup {
  display: grid;
  grid-template: auto 36px / 240px auto;
  width: 80%;
  height: 90%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #bbbbbb;
  border-radius: 5px;
  overflow: hidden;
}

.list {
  grid-row: 1;
  grid-column: 1;
  padding: 5px 15px;
  overflow-y: auto;
}

.list .title {
  font-weight: bold;
  overflow: hidden;
  margin: 10px 0;
}

.list .title:after {
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

.list .title .download-btn {
  cursor: pointer;
}

.list .slide {
  position: relative;
  margin: 10px 0;
  border: 2px solid #dddddd;
  cursor: pointer;
}

.list .slide>img {
  display: block;
  width: 100%;
}

.list .slide>.tag {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  padding: 3px 5px;
  font-size: small;
  color: #f7f7f7;
  background: rgba(64, 64, 64, .4);
}

.list .slide.active {
  border-color: #2d70e7;
}

.list .slide.active>.tag {
  background: #2d70e7;
}

.list .slide.unlocked {
  border-color: #d7d48e;
}

.list .slide.unlocked.active {
  border-color: #e6cb2d;
}

.list .slide.unlocked.active>.tag {
  background: #e6cb2d;
}

.list .slide.answered {
  border-color: #8dd790;
}

.list .slide.answered.active {
  border-color: #4caf50;
}

.list .slide.answered.active>.tag {
  background: #4caf50;
}

.tail {
  grid-row: 2;
  grid-column: 1;
  padding: 5px 15px;
  line-height: 26px;
  border-top: 1px solid #bbbbbb;
}

.tail label {
  font-size: small;
}

.tail input[type="checkbox"] {
  appearance: auto;
  vertical-align: middle;
}

.detail {
  grid-row: 1 / span 2;
  grid-column: 2;
  padding: 25px 40px;
  overflow-y: auto;
  border-left: 1px solid #bbbbbb;
}

.detail .cover {
  border: 1px solid #dddddd;
  box-shadow: 0 1px 4px 3px rgba(0, 0, 0, .1);
}

.detail .cover>img {
  display: block;
  width: 100%;
}

.detail .body {
  margin-top: 25px;
}

.detail .body>textarea {
  width: 100%;
  min-height: 40px;
  resize: vertical;
}

.detail .actions {
  margin-top: 25px;
  text-align: center;
}

.detail .actions>button {
  margin: 0 20px;
  padding: 4px 10px;
}
</style>
