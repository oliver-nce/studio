<template>
  <div class="flex h-full flex-col">
    <div class="border-b border-gray-200 px-3 py-3">
      <label class="mb-1 block text-xs font-medium text-gray-500">
        {{ targetDoctype || 'No DocType' }}
      </label>
      <p class="text-xs text-gray-400">
        Click a field to add it to the form
      </p>
    </div>
    <div class="flex-1 overflow-hidden">
      <PathFinderCore
        v-if="targetDoctype"
        :rootDoctype="targetDoctype"
        mode="single"
        @path-selected="emit('path-selected', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PathFinderCore from './PathFinderCore.vue'

defineProps<{ targetDoctype: string }>()
const emit = defineEmits<{ (e: 'path-selected', path: string): void }>()
</script>
