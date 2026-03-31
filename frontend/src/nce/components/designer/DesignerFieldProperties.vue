<template>
  <div class="p-4">
    <!-- No selection -->
    <div v-if="!field" class="text-center text-xs text-gray-400 py-12">
      Select a field to edit its properties
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="text-xs font-semibold uppercase text-gray-500 tracking-wide">
        Field Properties
      </div>

      <!-- Label -->
      <div>
        <label class="mb-1 block text-xs text-gray-600">Label</label>
        <input type="text" :value="field.label"
               @input="update('label', ($event.target as HTMLInputElement).value)"
               class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
      </div>

      <!-- Column Span -->
      <div>
        <label class="mb-1 block text-xs text-gray-600">Column Span</label>
        <div class="flex gap-2">
          <button v-for="opt in spanOptions" :key="opt.value"
                  @click="update('colSpan', opt.value)"
                  class="flex-1 rounded border py-1 text-xs"
                  :class="field.colSpan === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Required -->
      <div class="flex items-center gap-2">
        <input type="checkbox" :checked="field.required"
               @change="update('required', ($event.target as HTMLInputElement).checked)"
               class="h-4 w-4" />
        <label class="text-sm text-gray-700">Required</label>
      </div>

      <!-- Read-only info -->
      <div class="border-t border-gray-100 pt-3">
        <div class="text-xs text-gray-400">Bind Path</div>
        <code class="text-xs text-gray-600">{{ field.bindPath }}</code>
        <div class="mt-2 text-xs text-gray-400">Field Type</div>
        <code class="text-xs text-gray-600">{{ field.fieldtype }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNceFormDesignerStore } from '@nce/stores/nceFormDesignerStore'

const store = useNceFormDesignerStore()

const field = computed(() =>
  store.fields.find(f => f.id === store.selectedFieldId) ?? null
)

const spanOptions = [
  { label: 'Full', value: 12 },
  { label: 'Half', value: 6 },
  { label: '1/3', value: 4 },
]

function update(key: string, value: any) {
  if (!store.selectedFieldId) return
  store.updateField(store.selectedFieldId, { [key]: value })
}
</script>
