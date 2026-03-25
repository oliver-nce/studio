<template>
	<div class="nce-palette-group rounded-lg border border-gray-200 bg-white shadow-sm">
		<!-- Group header -->
		<div
			class="flex items-center justify-between border-b border-gray-200 px-3 py-2"
			@click="toggleExpanded"
		>
			<div class="flex items-center gap-2">
				<FeatherIcon
					:name="expanded ? 'chevron-down' : 'chevron-right'"
					class="h-4 w-4 text-gray-500"
				/>
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-700">{{ groupName }}</span>
				<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
					{{ components.length }}
				</span>
			</div>
		</div>

		<!-- Group content -->
		<div v-if="expanded" class="p-3">
			<div class="grid grid-cols-2 gap-2">
				<Draggable
					v-for="component in components"
					:key="component.name"
					:item="component"
					:group="{ name: 'components', pull: 'clone', put: false }"
					:clone="cloneComponent"
					@start="onDragStart"
					@end="onDragEnd"
					class="nce-palette-item flex cursor-grab flex-col items-center justify-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing"
					draggable="false"
				>
					<div class="flex items-center justify-center rounded bg-white px-2 py-1 shadow-sm">
						<component
							:is="component.icon"
							v-if="component.icon"
							class="h-4 w-4 text-gray-700"
						/>
						<span v-else class="text-xs font-bold text-gray-400">{{ component.name.charAt(0) }}</span>
					</div>
					<span class="text-[10px] font-medium text-gray-600">{{ component.label }}</span>
				</Draggable>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { FeatherIcon } from "frappe-ui"
import Draggable from "vuedraggable"

export interface PaletteComponent {
	name: string
	label: string
	icon?: any
	category: string
}

const props = defineProps<{
	groupName: string
	components: PaletteComponent[]
}>()

const emit = defineEmits<{
	(e: "add-component", component: PaletteComponent): void
}>()

const expanded = ref(true)

function toggleExpanded() {
	expanded.value = !expanded.value
}

function cloneComponent(original: PaletteComponent): PaletteComponent {
	return { ...original }
}

function onDragStart(event: any) {
	event.item.dataset.draggedComponent = JSON.stringify(event.item.dataset.component)
}

function onDragEnd(event: any) {
	const componentData = event.item.dataset.draggedComponent
	if (componentData) {
		const component: PaletteComponent = JSON.parse(componentData)
		emit("add-component", component)
	}
}
</script>

<style scoped>
.nce-palette-item {
	touch-action: none;
}
</style>
