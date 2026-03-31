<template>
  <div class="flex h-screen flex-col bg-gray-50">
    <!-- Top bar -->
    <div class="flex h-12 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
      <span class="text-sm font-medium text-gray-700">
        {{ store.formDefinition?.form_title }} — Designer
      </span>
      <div class="flex gap-2">
        <Button variant="ghost" @click="preview">Preview</Button>
        <Button
          variant="solid"
          :loading="store.isSaving"
          :disabled="!store.isDirty"
          @click="store.saveDesign()"
        >
          Save Layout
        </Button>
      </div>
    </div>

    <!-- 3-column body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left: PathFinder -->
      <div class="w-64 flex-shrink-0 overflow-hidden border-r bg-white">
        <PathFinderPanelDesigner
          :targetDoctype="store.formDefinition?.target_doctype || ''"
          @path-selected="onPathSelected"
        />
      </div>

      <!-- Centre: Canvas -->
      <div class="flex-1 overflow-auto p-6">
        <DesignerCanvas />
      </div>

      <!-- Right: Properties -->
      <div class="w-64 flex-shrink-0 overflow-y-auto border-l bg-white">
        <DesignerFieldProperties />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import { useNceFormDesignerStore } from '@nce/stores/nceFormDesignerStore'
import { useFieldMeta } from '@nce/composables/useFieldMeta'
import PathFinderPanelDesigner from '@nce/components/PathFinder/PathFinderPanelDesigner.vue'
import DesignerCanvas from '@nce/components/designer/DesignerCanvas.vue'
import DesignerFieldProperties from '@nce/components/designer/DesignerFieldProperties.vue'

const route = useRoute()
const router = useRouter()
const store = useNceFormDesignerStore()
const { resolveNestedFieldMeta } = useFieldMeta()

const formName = route.params.formName as string

onMounted(() => store.loadForm(formName))

async function onPathSelected(path: string) {
  const dt = store.formDefinition?.target_doctype || ''
  const meta = await resolveNestedFieldMeta(dt, path).catch(() => null)
  store.addField(path, meta)
}

function preview() {
  const formName = route.params.formName as string
  router.push({ name: 'NceFormRuntime', params: { formName } })
}
</script>
