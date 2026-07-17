<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import './style/auth.css'
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__backdrop" />
    <div class="app-shell__content">
      <AppHeader />
      <RouterView />
    </div>
  </div>
</template>
