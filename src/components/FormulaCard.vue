<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'

const props = withDefaults(
  defineProps<{
    formula: string
    /** 列表预览用紧凑模式，减小 KaTeX 字号 */
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

/** 将 LaTeX 源码编译为 HTML */
const renderedHTML = computed(() => {
  try {
    return katex.renderToString(props.formula, {
      throwOnError: false,
      displayMode: !props.compact,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `<span class="text-red-400">${message}</span>`
  }
})
</script>

<template>
  <div
    class="math-card-rendered overflow-x-auto"
    :class="compact ? 'is-compact py-0.5' : 'py-2'"
    v-html="renderedHTML"
  />
</template>

<style scoped>
.math-card-rendered :deep(.katex) {
  color: #e2e8f0;
  font-size: 1.15em;
}

.math-card-rendered.is-compact :deep(.katex) {
  font-size: 0.92em;
}

.math-card-rendered.is-compact :deep(.katex-display) {
  margin: 0;
}
</style>