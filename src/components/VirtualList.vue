<script setup lang="ts" generic="T">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    /** 单项固定高度（px），虚拟列表依赖恒定行高 */
    itemHeight: number
    /** 视口上下额外多渲染的条数，减少快速滚动白屏 */
    overscan?: number
    /** 列表可视区域高度（px），可由父级动态对齐传入 */
    containerHeight?: number
    getKey: (item: T, index: number) => string | number
  }>(),
  {
    overscan: 4,
    containerHeight: 560,
  },
)

defineSlots<{
  default: (props: { item: T; index: number }) => unknown
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const measuredHeight = ref(props.containerHeight)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleRange = computed(() => {
  const viewportHeight = measuredHeight.value
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop.value / props.itemHeight) - props.overscan,
  )
  const endIndex = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + viewportHeight) / props.itemHeight) + props.overscan,
  )
  return { startIndex, endIndex }
})

const visibleItems = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return props.items.slice(startIndex, endIndex).map((item, offset) => ({
    item,
    index: startIndex + offset,
  }))
})

const offsetY = computed(() => visibleRange.value.startIndex * props.itemHeight)

const handleScroll = () => {
  const container = scrollContainerRef.value
  if (!container) return
  scrollTop.value = container.scrollTop
}

const syncContainerHeight = () => {
  const container = scrollContainerRef.value
  if (!container) return
  measuredHeight.value = container.clientHeight || props.containerHeight
}

/** 父级动态传入高度时同步内部测量值 */
watch(
  () => props.containerHeight,
  (nextHeight) => {
    measuredHeight.value = nextHeight
  },
)

/** 数据源变化时校正滚动位置，避免越界空白 */
watch(
  () => props.items.length,
  () => {
    const container = scrollContainerRef.value
    if (!container) return
    const maxScrollTop = Math.max(0, totalHeight.value - measuredHeight.value)
    if (container.scrollTop > maxScrollTop) {
      container.scrollTop = maxScrollTop
      scrollTop.value = maxScrollTop
    }
  },
)

onMounted(() => {
  syncContainerHeight()
  window.addEventListener('resize', syncContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncContainerHeight)
})
</script>

<template>
  <div
    ref="scrollContainerRef"
    class="overflow-y-auto overscroll-contain"
    :style="{ height: `${containerHeight}px` }"
    @scroll.passive="handleScroll"
  >
    <div class="relative w-full" :style="{ height: `${totalHeight}px` }">
      <div
        class="absolute top-0 right-0 left-0 will-change-transform"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="{ item, index } in visibleItems"
          :key="getKey(item, index)"
          class="box-border"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>
