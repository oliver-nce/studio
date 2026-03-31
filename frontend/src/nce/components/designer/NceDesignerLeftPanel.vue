<template>
	<div class="flex h-full w-60 flex-col border-r bg-white">
		<div class="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-500">
			Form Components
		</div>
		<div class="flex-1 overflow-y-auto p-2">
			<div v-for="group in componentGroups" :key="group.label" class="mb-3">
				<div class="mb-1 px-1 text-[10px] font-semibold uppercase text-gray-400">
					{{ group.label }}
				</div>
				<div
					v-for="comp in group.components"
					:key="comp.name"
					class="mb-1 flex cursor-grab items-center gap-2 rounded border border-transparent px-2 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50"
					draggable="true"
					@dragstart="(ev) => handleDragStart(ev, comp.name)"
				>
					<component :is="comp.icon" class="h-4 w-4 text-gray-400" />
					<span>{{ comp.title }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import useCanvasStore from "@/stores/canvasStore"
import { NCE_COMPONENTS } from "@/nce/data/nceComponents"

const canvasStore = useCanvasStore()

const componentGroups = [
	{
		label: "Fields",
		components: [NCE_COMPONENTS.NceFormField, NCE_COMPONENTS.NceCaption],
	},
	{
		label: "Layout",
		components: [NCE_COMPONENTS.NceFormGrid, NCE_COMPONENTS.NceTabContainer],
	},
	{
		label: "Actions",
		components: [NCE_COMPONENTS.NceFormActionBar, NCE_COMPONENTS.NceActionButton],
	},
]

function handleDragStart(ev: DragEvent, componentName: string) {
	canvasStore.handleDragStart(ev, componentName)
}
</script>
