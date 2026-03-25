<template>
	<div
		class="nce-form-grid grid gap-4"
		:style="gridStyle"
	>
		<NceFormField
			v-for="field in fields"
			:key="field"
			:fieldPath="field"
			:editable="true"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import NceFormField from "./NceFormField.vue"
import { useNceFormStore } from "@nce/stores"
import type { FieldMeta } from "@nce/types"

const props = withDefaults(
	defineProps<{
		fields: string[]
		gridConfig?: Record<string, { colSpan?: number; rowSpan?: number }>
	}>(),
	{
		gridConfig: () => ({}),
	}
)

const nceFormStore = useNceFormStore()

// Default 2-column grid
const GRID_COLS = "repeat(2, minmax(0, 1fr))"

// Build grid style from gridConfig
const gridStyle = computed(() => {
	if (!props.gridConfig || Object.keys(props.gridConfig).length === 0) {
		return { gridTemplateColumns: GRID_COLS }
	}

	// Check if gridConfig has column count defined
	if (props.gridConfig["_columns"]) {
		return { gridTemplateColumns: `repeat(${props.gridConfig["_columns"]}, minmax(0, 1fr))` }
	}

	return { gridTemplateColumns: GRID_COLS }
})

// Build per-field grid positions
const getFieldStyle = (fieldPath: string): Record<string, string> => {
	const config = props.gridConfig?.[fieldPath] || {}
	return {
		gridColumn: config.colSpan ? `span ${config.colSpan} / span ${config.colSpan}` : "auto",
		gridRow: config.rowSpan ? `span ${config.rowSpan} / span ${config.rowSpan}` : "auto",
	}
}
</script>

<style scoped>
.nce-form-grid {
	width: 100%;
}
</style>
