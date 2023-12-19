<script setup>
import { defineProps } from "vue";

const props = defineProps([
  "tag",
  "type",
  "result",
]);
</script>

<template>
  <template v-if="props.type === 4">
    <p v-for="(value, key) in props.result">
      {{ `${props.tag} ${key + 1}：` }}<code>{{ JSON.stringify(value) }}</code>
    </p>
  </template>
  <template v-else>
    <p>
      {{ `${props.tag}：` }}<code>{{ JSON.stringify(props.result) }}</code>
    </p>
  </template>
</template>
