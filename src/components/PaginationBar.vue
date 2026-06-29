<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  (event: 'change', page: number): void
}>()

function setPage(page: number) {
  if (page < 1 || page > props.totalPages || page === props.page) {
    return
  }

  emit('change', page)
}
</script>

<template>
  <div class="pagination">
    <button type="button" class="ghost-button" :disabled="page <= 1" @click="setPage(page - 1)">
      上一页
    </button>

    <div class="pagination__pages">
      <button
        v-for="pageNumber in totalPages"
        :key="pageNumber"
        type="button"
        class="page-button"
        :class="{ 'page-button--active': pageNumber === page }"
        @click="setPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
    </div>

    <button
      type="button"
      class="ghost-button"
      :disabled="page >= totalPages"
      @click="setPage(page + 1)"
    >
      下一页
    </button>
  </div>
</template>
