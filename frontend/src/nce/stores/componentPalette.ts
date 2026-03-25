// NCE Studio — Component Palette Store
import { defineStore } from "pinia"
import { ref, computed } from "vue"

export interface PaletteComponent {
	name: string
	label: string
	category: string
	description?: string
	icon?: string
	defaultProps?: Record<string, any>
}

export const useComponentPaletteStore = defineStore("componentPalette", () => {
	const components = ref<PaletteComponent[]>([
		{ name: "NceFormHeader", label: "Form Header", category: "forms", description: "Form title and header section", icon: "FileText", defaultProps: { title: "Form Title" } },
		{ name: "NceFormActionBar", label: "Action Bar", category: "forms", description: "Save, Cancel, and Submit buttons", icon: "Activity", defaultProps: {} },
		{ name: "NceFormGrid", label: "Form Grid", category: "layout", description: "Grid layout container", icon: "Grid", defaultProps: { columns: 2 } },
		{ name: "NceTabContainer", label: "Tab Container", category: "layout", description: "Tabbed interface for organizing fields", icon: "Tabs", defaultProps: {} },
		{ name: "NceFormField", label: "Form Field", category: "data", description: "Input field for form data", icon: "Edit", defaultProps: { fieldtype: "Data" } },
		{ name: "NceCaption", label: "Caption", category: "feedback", description: "Instructional or descriptive text", icon: "AlertCircle", defaultProps: { text: "Hint text" } },
		{ name: "NceActionButton", label: "Action Button", category: "feedback", description: "Custom action button", icon: "Play", defaultProps: { label: "Click Me" } },
	])

	const groupedComponents = computed(() => {
		const groups: Record<string, PaletteComponent[]> = {}
		for (const component of components.value) {
			if (!groups[component.category]) groups[component.category] = []
			groups[component.category].push(component)
		}
		return groups
	})

	const categories = computed(() => [...new Set(components.value.map((c: PaletteComponent) => c.category))])

	const searchQuery = ref("")
	const filteredComponents = computed(() => {
		if (!searchQuery.value) return components.value
		const query = searchQuery.value.toLowerCase()
		return components.value.filter((c: PaletteComponent) =>
			c.name.toLowerCase().includes(query) ||
			c.label.toLowerCase().includes(query) ||
			(c.description && c.description.toLowerCase().includes(query))
		)
	})

	return {
		components,
		groupedComponents,
		categories,
		filteredComponents,
		searchQuery,
	}
})
