<script setup lang="ts">
import FormulaCard from './FormulaCard.vue'
import type { MathConcept } from '../data/mockData.ts'

defineProps<{
  concept: MathConcept
  selected: boolean
  categoryLabel: string
}>()

defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="flex h-full w-full flex-col rounded-xl border p-3 text-left transition"
    :class="
      selected
        ? 'border-sky-400/40 bg-sky-400/10 shadow-[0_0_24px_rgba(56,189,248,0.08)]'
        : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
    "
    @click="$emit('select')"
  >
    <div class="mb-1 flex items-start justify-between gap-2">
      <span class="line-clamp-1 text-sm font-medium text-slate-100">{{ concept.title }}</span>
      <span
        v-if="concept.hasInteractive"
        class="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
      >
        交互
      </span>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden">
      <FormulaCard :formula="concept.latexFormula" compact />
    </div>

    <span class="mt-1 text-[11px] text-slate-500">{{ categoryLabel }}</span>
  </button>
</template>
