<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="empty-state">
    <span class="empty-state__eyebrow">当前状态</span>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
  </div>
</template>
