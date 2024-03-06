<script setup>
import { ref, computed, KeepAlive } from "vue";
import { randInt, coverStyle } from "@/util";
import { retryProblem } from "@/api";
import PresentationView from "./PresentationView.vue";
import ProblemView from "./ProblemView.vue";

const props = defineProps([
  "config",
  "presentations",
  "slides",
  "currentPresentationId",
  "currentSlideId",
  "problemStatus",
  "onNavigate",
  "onAnswerProblem",
]);

const currentPresentation = computed(() =>
  props.currentPresentationId && props.presentations.get(props.currentPresentationId)
);
const currentSlide = computed(() =>
  props.currentSlideId && props.slides.get(props.currentSlideId)
);
const currentProblem = computed(() => currentSlide.value?.problem);

const showAllSlides = ref(false);

function canRetry(problem) {
  return props.problemStatus.has(problem.problemId) && !problem.result;
}

async function handleRetry(problem, content) {
  const { problemId, problemType } = problem;

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
    const result = parseAnswer(problemType, content);
    const status = props.problemStatus.get(problemId);
    const dt = status.startTime + randInt(...props.config.autoAnswerDelay);

    const resp = await retryProblem(problem, result, dt);

    if (resp.code !== 0)
      throw new Error(`${resp.msg} (${resp.code})`);

    if (!resp.data.success.includes(problemId))
      throw new Error("服务器未返回成功信息");

    props.onAnswerProblem?.(problemId, result);

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

</script>

<template>
  <div class="container">
    <div class="list">
      <PresentationView
        v-for="presentation in presentations.values()"
        :key="presentation.id"
        :presentation="presentation"
        :show-all-slides="showAllSlides"
        :currentSlideId="props.currentSlideId"
        :problem-status="props.problemStatus"
        @navigate="props.onNavigate"
      />
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
        <KeepAlive :max="10">
          <ProblemView
            v-if="currentProblem"
            :key="currentProblem.problemId"
            :problem="currentProblem"
            :can-retry="canRetry(currentProblem)"
            @retry="(content) => handleRetry(currentProblem, content)"
          />
        </KeepAlive>
      </template>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template: auto 36px / 240px auto;
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
</style>
