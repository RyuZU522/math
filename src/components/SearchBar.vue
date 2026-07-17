<script setup lang="ts">
import { ref, computed } from 'vue'
import { categories, type CategoryFilter, type MathConcept } from '../data/mockData'
import { matchesConcept } from '../utils/conceptSearch'

const props = defineProps<{
  searchQuery: string
  selectedCategory: CategoryFilter
  concepts: MathConcept[]
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedCategory': [value: CategoryFilter]
  'select-concept': [id: string]
}>()

const isFocused = ref(false)

const suggestions = computed(() => {
  if (!props.searchQuery.trim()) return []
  return props.concepts
    .filter((conceptItem) => matchesConcept(conceptItem, props.searchQuery))
    .slice(0, 8)
})

const handleSelect = (concept: MathConcept) => {
  emit('update:searchQuery', '') // 清空搜索框
  emit('select-concept', concept.id)
  isFocused.value = false
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
  }, 200)
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div class="relative flex-1">
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        type="search"
        :value="searchQuery"
        placeholder="搜索公式、定理或关键词…"
        class="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none backdrop-blur transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        @focus="isFocused = true"
        @blur="handleBlur"
      />
      
      <!-- 下拉建议列表 -->
      <div
        v-if="isFocused && suggestions.length > 0"
        class="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md shadow-2xl"
      >
        <ul class="max-h-[300px] overflow-y-auto py-2">
          <li
            v-for="item in suggestions"
            :key="item.id"
            class="cursor-pointer px-4 py-2.5 text-sm text-slate-300 hover:bg-sky-500/20 hover:text-sky-300 transition-colors"
            @click="handleSelect(item)"
          >
            <div class="font-medium">{{ item.title }}</div>
            <div class="text-xs text-slate-500 truncate mt-0.5">{{ item.description }}</div>
          </li>
        </ul>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="categoryItem in categories"
        :key="categoryItem"
        type="button"
        class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
        :class="
          selectedCategory === categoryItem
            ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
            : 'border-slate-700/80 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
        "
        @click="emit('update:selectedCategory', categoryItem)"
      >
        {{ categoryItem === 'All' ? '全部' : categoryItem }}
      </button>
    </div>
  </div>
</template>
