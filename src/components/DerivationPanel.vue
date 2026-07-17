<script setup lang="ts">
import { ref } from 'vue'
import FormulaCard from './FormulaCard.vue'

const props = defineProps<{
  steps: string[]
}>()

const isExpanded = ref(false)
const activeStep = ref(0)
</script>

<template>
  <div class="mt-6 rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden">
    <button
      type="button"
      class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-2">
        <svg
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span>展开推导过程</span>
      </div>
      <span class="text-xs text-slate-500">{{ steps.length }} 步</span>
    </button>

    <div
      v-show="isExpanded"
      class="border-t border-slate-700/60 p-4"
    >
      <div class="space-y-3">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="relative pl-6 cursor-pointer transition-all duration-300"
          :class="[
            index === activeStep ? 'opacity-100' : 'opacity-40 hover:opacity-70'
          ]"
          @click="activeStep = index"
        >
          <!-- 步骤连接线与圆点 -->
          <div class="absolute left-0 top-0 bottom-0 flex flex-col items-center">
            <div
              class="h-2 w-2 rounded-full mt-2 transition-colors duration-300"
              :class="index === activeStep ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'bg-slate-600'"
            ></div>
            <div
              v-if="index !== steps.length - 1"
              class="w-px flex-1 my-1 transition-colors duration-300"
              :class="index < activeStep ? 'bg-sky-400/50' : 'bg-slate-700'"
            ></div>
          </div>
          
          <div
            class="rounded-lg p-3 transition-colors duration-300"
            :class="index === activeStep ? 'bg-sky-900/20 border border-sky-500/20' : 'bg-transparent border border-transparent'"
          >
            <FormulaCard :formula="step" compact />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
