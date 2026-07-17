<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import VirtualList from '../components/VirtualList.vue'
import ConceptListItem from '../components/ConceptListItem.vue'
import ConceptDetail from '../components/ConceptDetail.vue'
import {
  mockConcepts,
  type CategoryFilter,
  type ConceptParam,
  type MathConcept,
} from '../data/mockData.ts'
import {
  buildShareableUrl,
  clampParamValue,
  readDashboardUrlState,
  replaceDashboardUrl,
} from '../utils/urlState.ts'
import { matchesConcept } from '../utils/conceptSearch.ts'

/** 虚拟列表单项固定高度（含 KaTeX 预览） */
const CONCEPT_ITEM_HEIGHT = 148
/** 概念库列表高度（与右侧主栏动态对齐） */
const conceptListHeight = ref(560)
const rightPanelRef = ref<any>(null)
const asideHeaderRef = ref<HTMLElement | null>(null)
let rightPanelObserver: ResizeObserver | null = null

/** 将左侧虚拟列表高度对齐到右侧「信息 + 可视化」总高度 */
const syncConceptListHeight = () => {
  const rightPanel = rightPanelRef.value?.$el ?? rightPanelRef.value
  if (!rightPanel) return

  if (window.innerWidth < 1024) {
    conceptListHeight.value = 420
    return
  }

  const headerHeight = asideHeaderRef.value?.offsetHeight ?? 0
  const sectionGap = 12
  const alignedHeight = Math.round(
    (rightPanel.offsetHeight || rightPanel.clientHeight || 560) - headerHeight - sectionGap,
  )
  conceptListHeight.value = Math.max(280, alignedHeight)
}

const searchQuery = ref('')
const selectedCategory = ref<CategoryFilter>('All')

const bootstrapUrlState = readDashboardUrlState()
const bootstrapConceptExists = mockConcepts.some(
  (conceptItem) => conceptItem.id === bootstrapUrlState.conceptId,
)

const selectedConceptId = ref(
  bootstrapConceptExists && bootstrapUrlState.conceptId
    ? bootstrapUrlState.conceptId
    : mockConcepts[0].id,
)

const activeParams = reactive<ConceptParam[]>([])
const shouldApplyUrlParamOverrides = ref(bootstrapConceptExists)
const canWriteUrl = ref(false)

const shareFeedback = ref('')
let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const filteredConcepts = computed(() =>
  mockConcepts.filter(
    (conceptItem) =>
      (selectedCategory.value === 'All' || conceptItem.category === selectedCategory.value)
      && matchesConcept(conceptItem, searchQuery.value),
  ),
)

const selectedConcept = computed<MathConcept | undefined>(() =>
  mockConcepts.find((conceptItem) => conceptItem.id === selectedConceptId.value),
)

const selectConcept = (conceptId: string) => {
  selectedConceptId.value = conceptId
}

const syncParamsFromConcept = (
  conceptItem: MathConcept | undefined,
  paramOverrides?: Record<string, number>,
) => {
  activeParams.splice(0, activeParams.length)
  if (!conceptItem?.defaultParams) return

  conceptItem.defaultParams.forEach((paramItem) => {
    const overrideValue = paramOverrides?.[paramItem.queryKey]
    const nextValue =
      overrideValue !== undefined
        ? clampParamValue(overrideValue, paramItem.min, paramItem.max)
        : paramItem.value
    activeParams.push({ ...paramItem, value: nextValue })
  })
}

const syncStateToUrl = () => {
  if (!canWriteUrl.value) return
  replaceDashboardUrl(
    selectedConceptId.value,
    activeParams.map((paramItem) => ({
      queryKey: paramItem.queryKey,
      value: paramItem.value,
    })),
  )
}

const restoreStateFromUrl = () => {
  const urlState = readDashboardUrlState()
  if (!urlState.conceptId) return

  const matchedConcept = mockConcepts.find(
    (conceptItem) => conceptItem.id === urlState.conceptId,
  )
  if (!matchedConcept) return

  canWriteUrl.value = false
  selectedConceptId.value = matchedConcept.id
  syncParamsFromConcept(matchedConcept, urlState.paramValues)
  shouldApplyUrlParamOverrides.value = false
  queueMicrotask(() => {
    canWriteUrl.value = true
  })
}

watch(
  selectedConcept,
  (conceptItem) => {
    const paramOverrides = shouldApplyUrlParamOverrides.value
      ? bootstrapUrlState.paramValues
      : undefined
    syncParamsFromConcept(conceptItem, paramOverrides)
    shouldApplyUrlParamOverrides.value = false
  },
  { immediate: true },
)

watch(filteredConcepts, (conceptList) => {
  if (conceptList.length === 0) return
  const stillVisible = conceptList.some(
    (conceptItem) => conceptItem.id === selectedConceptId.value,
  )
  if (!stillVisible) {
    selectedConceptId.value = conceptList[0].id
  }
})

watch(
  [selectedConceptId, activeParams],
  () => {
    syncStateToUrl()
  },
  { deep: true },
)

const getConceptKey = (conceptItem: MathConcept) => conceptItem.id

const copyShareLink = async () => {
  const shareUrl = buildShareableUrl(
    selectedConceptId.value,
    activeParams.map((paramItem) => ({
      queryKey: paramItem.queryKey,
      value: paramItem.value,
    })),
  )

  try {
    await navigator.clipboard.writeText(shareUrl)
    shareFeedback.value = '链接已复制'
  } catch {
    window.prompt('复制以下链接进行分享：', shareUrl)
    shareFeedback.value = '请手动复制'
  }

  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
  shareFeedbackTimer = setTimeout(() => {
    shareFeedback.value = ''
  }, 2000)
}

onMounted(() => {
  canWriteUrl.value = true
  syncStateToUrl()
  window.addEventListener('popstate', restoreStateFromUrl)
  window.addEventListener('resize', syncConceptListHeight)

  nextTick(() => {
    syncConceptListHeight()
    const rightPanel = rightPanelRef.value?.$el ?? rightPanelRef.value
    if (rightPanel) {
      rightPanelObserver = new ResizeObserver(() => {
        syncConceptListHeight()
      })
      rightPanelObserver.observe(rightPanel)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('popstate', restoreStateFromUrl)
  window.removeEventListener('resize', syncConceptListHeight)
  rightPanelObserver?.disconnect()
  rightPanelObserver = null
  if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
})

watch(
  [selectedConceptId, () => selectedConcept.value?.hasInteractive, () => activeParams.length],
  async () => {
    await nextTick()
    rightPanelObserver?.disconnect()
    const rightPanel = rightPanelRef.value?.$el ?? rightPanelRef.value
    if (rightPanel) {
      rightPanelObserver = new ResizeObserver(() => {
        syncConceptListHeight()
      })
      rightPanelObserver.observe(rightPanel)
    }
    syncConceptListHeight()
  },
)
</script>

<template>
  <div>
    <SearchBar
      v-model:search-query="searchQuery"
      v-model:selected-category="selectedCategory"
      :concepts="mockConcepts"
      @select-concept="selectConcept"
      class="mb-8"
    />

    <div class="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      <aside class="flex min-w-0 flex-col space-y-3">
        <div ref="asideHeaderRef" class="flex items-center gap-2">
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">
            概念库 · {{ filteredConcepts.length }}
          </p>
        </div>

        <div
          v-if="filteredConcepts.length === 0"
          class="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500"
          :style="{ minHeight: `${conceptListHeight}px` }"
        >
          未找到匹配的数学概念
        </div>

        <VirtualList
          v-else
          class="w-full rounded-xl border border-slate-700/50 bg-slate-950/40"
          :items="filteredConcepts"
          :item-height="CONCEPT_ITEM_HEIGHT"
          :container-height="conceptListHeight"
          :overscan="3"
          :get-key="getConceptKey"
        >
          <template #default="{ item: conceptItem }">
            <div class="box-border h-full px-1 pb-2">
              <ConceptListItem
                :concept="conceptItem"
                :selected="selectedConceptId === conceptItem.id"
                :category-label="conceptItem.category"
                @select="selectConcept(conceptItem.id)"
              />
            </div>
          </template>
        </VirtualList>
      </aside>

      <ConceptDetail
        v-if="selectedConcept"
        ref="rightPanelRef"
        class="min-w-0"
        :concept="selectedConcept"
        :active-params="activeParams"
        :share-feedback="shareFeedback"
        @copy-share="copyShareLink"
      />
    </div>

    <footer class="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
      数学概念与公式可视化看板
    </footer>
  </div>
</template>
