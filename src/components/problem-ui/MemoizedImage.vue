<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
});

const cachedSrc = ref("");

watch(
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

    if (
      newUrl.origin !== oldUrl.origin ||
      newUrl.pathname !== oldUrl.pathname
    ) {
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
</script>

<template>
  <img :src="cachedSrc" v-bind="$attrs" />
</template>
