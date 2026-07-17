<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ConceptParam, MathConcept } from '../data/mockData.ts'
import { renderInlineLatex } from '../utils/renderInlineLatex.ts'
import { useFavorites } from '../composables/useFavorites'
import FormulaCard from './FormulaCard.vue'
import InteractiveCanvas from './InteractiveCanvas.vue'
import '../style/concept-detail.css'

const props = defineProps<{
  concept: MathConcept
  activeParams: ConceptParam[]
  shareFeedback: string
}>()

defineEmits<{
  'copy-share': []
}>()

const router = useRouter()
const { isLoggedIn, isFavorite, toggleFavorite } = useFavorites()

type DetailTabKey = 'description' | 'intuitive' | 'rigorous' | 'application'

const DETAIL_TABS: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'description', label: '简介' },
  { key: 'intuitive', label: '直观理解' },
  { key: 'rigorous', label: '严格定义' },
  { key: 'application', label: '应用场景' },
]

const activeDetailTab = ref<DetailTabKey>('description')
const isDerivationExpanded = ref(false)
const activeDerivationStep = ref(0)
const favoriteFeedback = ref('')
let favoriteFeedbackTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.concept.id,
  () => {
    activeDetailTab.value = 'description'
    isDerivationExpanded.value = false
    activeDerivationStep.value = 0
    favoriteFeedback.value = ''
  },
)

const visibleDetailTabs = computed(() =>
  DETAIL_TABS.filter(
    (tabItem) =>
      tabItem.key === 'description' || Boolean(props.concept.details?.[tabItem.key]),
  ),
)

const paramValues = computed(() =>
  props.activeParams.map((paramItem) => paramItem.value),
)

const renderedDetailHTML = computed(() => {
  const detailText =
    activeDetailTab.value === 'description'
      ? props.concept.description
      : (props.concept.details?.[activeDetailTab.value] ?? '')
  return renderInlineLatex(detailText)
})

const conceptIsFavorite = computed(() => isFavorite(props.concept.id))

const showFavoriteFeedback = (message: string) => {
  favoriteFeedback.value = message
  if (favoriteFeedbackTimer) clearTimeout(favoriteFeedbackTimer)
  favoriteFeedbackTimer = setTimeout(() => {
    favoriteFeedback.value = ''
  }, 1800)
}

const handleToggleFavorite = async () => {
  if (!isLoggedIn.value) {
    await router.push({
      name: 'login',
      query: { redirect: `/?concept=${props.concept.id}` },
    })
    return
  }

  try {
    const wasFavorite = conceptIsFavorite.value
    await toggleFavorite(props.concept.id)
    showFavoriteFeedback(wasFavorite ? '已取消收藏' : '已加入收藏')
  } catch (error) {
    showFavoriteFeedback(error instanceof Error ? error.message : '收藏失败')
  }
}
</script>

<template>
  <main class="concept-detail">
    <section class="concept-detail__panel">
      <div class="concept-detail__header">
        <div class="concept-detail__title-group">
          <h2 class="concept-detail__title">{{ concept.title }}</h2>
          <span class="concept-detail__category">{{ concept.category }}</span>
          <button
            type="button"
            class="concept-detail__favorite-button"
            :class="{ 'concept-detail__favorite-button--active': conceptIsFavorite }"
            :title="conceptIsFavorite ? '取消收藏' : '收藏知识点'"
            @click="handleToggleFavorite"
          >
            <svg class="concept-detail__favorite-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            {{ conceptIsFavorite ? '已收藏' : '收藏' }}
          </button>
        </div>

        <div class="concept-detail__actions">
          <span
            v-if="favoriteFeedback || shareFeedback"
            class="concept-detail__share-feedback"
          >
            {{ favoriteFeedback || shareFeedback }}
          </span>
          <button
            type="button"
            class="concept-detail__share-button"
            @click="$emit('copy-share')"
          >
            复制分享链接
          </button>
        </div>
      </div>

      <FormulaCard :formula="concept.latexFormula" />

      <div class="concept-detail__information">
        <div class="concept-detail__tabs">
          <button
            v-for="tabItem in visibleDetailTabs"
            :key="tabItem.key"
            type="button"
            class="concept-detail__tab"
            :class="{ 'concept-detail__tab--active': activeDetailTab === tabItem.key }"
            @click="activeDetailTab = tabItem.key"
          >
            {{ tabItem.label }}
          </button>
        </div>

        <div class="concept-detail__description">
          <p class="concept-detail__text" v-html="renderedDetailHTML" />
        </div>
      </div>

      <div
        v-if="concept.derivationSteps?.length"
        class="mt-6 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/40"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800/50"
          @click="isDerivationExpanded = !isDerivationExpanded"
        >
          <div class="flex items-center gap-2">
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="{ 'rotate-90': isDerivationExpanded }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span>展开推导过程</span>
          </div>
          <span class="text-xs text-slate-500">{{ concept.derivationSteps.length }} 步</span>
        </button>

        <div v-show="isDerivationExpanded" class="border-t border-slate-700/60 p-4">
          <div class="space-y-3">
            <div
              v-for="(stepLatex, stepIndex) in concept.derivationSteps"
              :key="stepIndex"
              class="relative cursor-pointer pl-6 transition-all duration-300"
              :class="[
                stepIndex === activeDerivationStep
                  ? 'opacity-100'
                  : 'opacity-40 hover:opacity-70',
              ]"
              @click="activeDerivationStep = stepIndex"
            >
              <div class="absolute top-0 bottom-0 left-0 flex flex-col items-center">
                <div
                  class="mt-2 h-2 w-2 rounded-full transition-colors duration-300"
                  :class="
                    stepIndex === activeDerivationStep
                      ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                      : 'bg-slate-600'
                  "
                />
                <div
                  v-if="stepIndex !== concept.derivationSteps.length - 1"
                  class="my-1 w-px flex-1 transition-colors duration-300"
                  :class="
                    stepIndex < activeDerivationStep ? 'bg-sky-400/50' : 'bg-slate-700'
                  "
                />
              </div>

              <div
                class="rounded-lg border p-3 transition-colors duration-300"
                :class="
                  stepIndex === activeDerivationStep
                    ? 'border-sky-500/20 bg-sky-900/20'
                    : 'border-transparent bg-transparent'
                "
              >
                <FormulaCard :formula="stepLatex" compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="concept.hasInteractive" class="concept-detail__panel">
      <h3 class="concept-detail__section-title">交互可视化</h3>

      <InteractiveCanvas
        :concept-id="concept.id"
        :param-values="paramValues"
      />

      <div v-if="activeParams.length" class="concept-detail__params">
        <div
          v-for="(paramItem, paramIndex) in activeParams"
          :key="`${concept.id}-${paramItem.queryKey}`"
          class="concept-detail__param"
        >
          <div class="concept-detail__param-header">
            <label class="concept-detail__param-label">{{ paramItem.name }}</label>
            <span class="concept-detail__param-value">{{ paramItem.value }}</span>
          </div>
          <input
            v-model.number="activeParams[paramIndex].value"
            type="range"
            :min="paramItem.min"
            :max="paramItem.max"
            :step="paramItem.step"
            class="concept-detail__slider"
          />
        </div>
      </div>
    </section>

    <section v-else class="concept-detail__empty">
      该条目暂无交互可视化。可选择带「交互」标记的概念体验 Canvas。
    </section>
  </main>
</template>
