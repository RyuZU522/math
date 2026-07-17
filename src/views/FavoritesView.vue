<script setup lang="ts">
import { computed } from 'vue'
import { mockConcepts } from '../data/mockData'
import { useFavorites } from '../composables/useFavorites'
import '../style/auth.css'

const { favoriteConceptIds, isFavoritesLoading } = useFavorites()

const favoriteConcepts = computed(() =>
  favoriteConceptIds.value
    .map((conceptId) => mockConcepts.find((conceptItem) => conceptItem.id === conceptId))
    .filter((conceptItem): conceptItem is NonNullable<typeof conceptItem> => Boolean(conceptItem)),
)
</script>

<template>
  <section>
    <h1 class="favorites-page__title">我的收藏</h1>
    <p class="favorites-page__subtitle">
      已收藏 {{ favoriteConcepts.length }} 个知识点，点击可回到看板查看详情。
    </p>

    <div v-if="isFavoritesLoading" class="favorites-page__empty">正在加载收藏…</div>

    <div v-else-if="favoriteConcepts.length === 0" class="favorites-page__empty">
      还没有收藏。去概念库点击标题旁的星标即可添加。
      <div style="margin-top: 0.75rem">
        <RouterLink :to="{ name: 'dashboard' }">返回概念库</RouterLink>
      </div>
    </div>

    <div v-else class="favorites-page__grid">
      <RouterLink
        v-for="conceptItem in favoriteConcepts"
        :key="conceptItem.id"
        class="favorites-page__card"
        :to="{ name: 'dashboard', query: { concept: conceptItem.id } }"
      >
        <div class="favorites-page__card-title">{{ conceptItem.title }}</div>
        <div class="favorites-page__card-meta">
          {{ conceptItem.category }}
          <span v-if="conceptItem.hasInteractive"> · 交互</span>
        </div>
        <p class="favorites-page__card-desc">{{ conceptItem.description }}</p>
      </RouterLink>
    </div>
  </section>
</template>
