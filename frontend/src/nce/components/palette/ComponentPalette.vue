<template>
	<div class="nce-component-palette flex h-full flex-col overflow-hidden bg-white">
		<!-- Header with search -->
		<div class="flex-shrink-0 border-b border-gray-200 px-3 py-3">
			<div class="flex items-center gap-2">
				<FeatherIcon name="search" class="h-4 w-4 text-gray-400" />
				<input
					v-model="searchQuery"
					type="text"
					class="h-8 flex-1 appearance-none rounded border border-gray-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
					placeholder="Search components..."
				/>
			</div>
		</div>

		<!-- Groups list -->
		<div class="flex-1 overflow-y-auto p-3">
			<PaletteGroup
				v-for="group in filteredGroups"
				:key="group.name"
				:group-name="group.name"
				:components="group.components"
				@add-component="handleAddComponent"
			/>
		</div>

		<!-- Footer -->
		<div class="flex-shrink-0 border-t border-gray-200 px-3 py-2">
			<p class="text-[10px] text-gray-400">
				Drag components into the form to add them
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FeatherIcon } from "frappe-ui"
import PaletteGroup from "./PaletteGroup.vue"
import { useComponentPaletteStore, type PaletteComponent } from "@nce/stores/componentPalette"

const paletteStore = useComponentPaletteStore()

// Delegate search state to the store
const searchQuery = computed({
	get: () => paletteStore.searchQuery,
	set: (val: string) => { paletteStore.searchQuery = val },
})

const filteredGroups = computed(() => {
	const source = searchQuery.value
		? paletteStore.filteredComponents
		: paletteStore.components

	// Group components by category
	const groups: Record<string, PaletteComponent[]> = {}
	for (const component of source) {
		if (!groups[component.category]) {
			groups[component.category] = []
		}
		groups[component.category].push(component)
	}

	return Object.entries(groups).map(([name, components]) => ({
		name,
		components,
	}))
})

const emit = defineEmits<{
	(e: "add-component", component: PaletteComponent): void
}>()

function handleAddComponent(component: PaletteComponent) {
	emit("add-component", component)
}
</script>
