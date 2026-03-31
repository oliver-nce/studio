<template>
  <div>
    <!-- Empty state -->
    <div
      v-if="!store.fields.length"
      class="flex flex-col items-center gap-3 py-24 text-gray-400"
    >
      <FeatherIcon name="layout" class="h-12 w-12 text-gray-300" />
      <p class="text-sm">Click a field in the PathFinder to add it</p>
    </div>

    <!-- Draggable field list -->
    <draggable
      v-else
      v-model="orderedFields"
      item-key="id"
      handle=".drag-handle"
      class="flex flex-col gap-2"
    >
      <template #item="{ element }">
        <div
          class="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm cursor-pointer transition-all"
          :class="{
            'ring-2 ring-blue-500 border-blue-300': store.selectedFieldId === element.id,
          }"
          @click="store.selectedFieldId = element.id"
        >
          <FeatherIcon
            name="menu"
            class="drag-handle h-4 w-4 flex-shrink-0 cursor-grab text-gray-300"
          />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-800 truncate">
              {{ element.label }}
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ element.bindPath }}
            </div>
          </div>
          <span
            class="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
          >
            {{ element.fieldtype }}
          </span>
          <button
            class="flex-shrink-0"
            @click.stop="store.removeField(element.id)"
          >
            <FeatherIcon name="x" class="h-4 w-4 text-gray-300 hover:text-red-500" />
          </button>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { FeatherIcon } from 'frappe-ui'
import { useNceFormDesignerStore } from '@nce/stores/nceFormDesignerStore'

const store = useNceFormDesignerStore()

const orderedFields = computed({
  get: () => store.fields,
  set: (newOrder) => {
    store.fields = newOrder
    if (store.tabs.length > 0) {
      store.tabs[0].fields = newOrder.map((f) => f.bindPath)
    }
    store.isDirty = true
  },
})
</script>
