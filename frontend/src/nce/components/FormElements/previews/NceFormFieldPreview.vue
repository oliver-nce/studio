<template>
	<div class="nce-field-preview rounded border border-dashed border-gray-300 bg-white p-2">
		<label class="mb-1 block text-xs font-medium text-gray-600">
			{{ displayLabel }}
			<span v-if="required" class="text-red-500">*</span>
		</label>
		<div class="rounded bg-gray-50 px-2 py-1.5 text-sm text-gray-400">
			<template v-if="fieldPath">
				<code class="font-mono text-xs text-blue-600">{{ fieldPath }}</code>
			</template>
			<template v-else>
				<span class="italic">No field bound</span>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		fieldPath?: string
		fieldType?: string
		label?: string
		editable?: boolean
		placeholder?: string
		required?: boolean
	}>(),
	{
		fieldPath: "",
		fieldType: "",
		label: "",
		editable: true,
		placeholder: "",
		required: false,
	}
)

const displayLabel = computed(() => {
	if (props.label) return props.label
	if (props.fieldPath) {
		const segments = props.fieldPath.split(".")
		return segments[segments.length - 1]
	}
	return "Untitled Field"
})
</script>
