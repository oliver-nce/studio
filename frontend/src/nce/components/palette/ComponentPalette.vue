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
import { ref, computed } from "vue"
import { FeatherIcon } from "frappe-ui"
import PaletteGroup from "./PaletteGroup.vue"

// Component definitions with categories
interface PaletteComponent {
	name: string
	label: string
	category: string
	description?: string
	icon?: any
}

const allComponents: PaletteComponent[] = [
	// Forms
	{ name: "NceFormHeader", label: "Form Header", category: "forms", description: "Form title and header section", icon: "FileText" },
	{ name: "NceFormActionBar", label: "Action Bar", category: "forms", description: "Save, Cancel, and Submit buttons", icon: "Activity" },
	// Layout
	{ name: "NceFormGrid", label: "Form Grid", category: "layout", description: "Grid layout container", icon: "Grid" },
	{ name: "NceTabContainer", label: "Tab Container", category: "layout", description: "Tabbed interface for organizing fields", icon: "Tabs" },
	// Data
	{ name: "NceFormField", label: "Form Field", category: "data", description: "Input field for form data", icon: "Edit" },
	// Feedback
	{ name: "NceCaption", label: "Caption", category: "feedback", description: "Instructional or descriptive text", icon: "AlertCircle" },
	{ name: "NceActionButton", label: "Action Button", category: "feedback", description: "Custom action button", icon: "Play" },
]

// Grouped components
const groupedComponents = computed(() => {
	const groups: Record<string, PaletteComponent[]> = {}
	for (const component of allComponents) {
		if (!groups[component.category]) {
			groups[component.category] = []
		}
		groups[component.category].push(component)
	}
	return groups
})

// Search functionality
const searchQuery = ref("")

const filteredGroups = computed(() => {
	if (!searchQuery.value) {
		return Object.entries(groupedComponents.value).map(([name, components]) => ({
			name,
			components,
		}))
	}

	const query = searchQuery.value.toLowerCase()
	const filteredGroups: typeof filteredGroups.value = []

	for (const [groupName, components] of Object.entries(groupedComponents.value)) {
		const filteredComponents = components.filter(
			(component) =>
				component.name.toLowerCase().includes(query) ||
				component.label.toLowerCase().includes(query) ||
				(component.description && component.description.toLowerCase().includes(query))
		)

		if (filteredComponents.length > 0) {
			filteredGroups.push({
				name: groupName,
				components: filteredComponents,
			})
		}
	}

	return filteredGroups
})

const emit = defineEmits<{
	(e: "add-component", component: PaletteComponent): void
}>()

function handleAddComponent(component: PaletteComponent) {
	emit("add-component", component)
}
</script>
