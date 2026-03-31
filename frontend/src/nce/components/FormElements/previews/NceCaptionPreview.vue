<template>
	<component :is="tagName" :class="levelClasses">
		{{ text || "Caption text" }}
	</component>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		text?: string
		level?: "h1" | "h2" | "h3" | "h4" | "label" | "help"
		fieldPath?: string
	}>(),
	{
		text: "Caption text",
		level: "label",
		fieldPath: "",
	}
)

const tagName = computed(() => {
	const map: Record<string, string> = {
		h1: "h1", h2: "h2", h3: "h3", h4: "h4",
		label: "label", help: "p",
	}
	return map[props.level] || "span"
})

const levelClasses = computed(() => {
	const map: Record<string, string> = {
		h1: "text-2xl font-bold text-gray-900",
		h2: "text-xl font-semibold text-gray-900",
		h3: "text-lg font-semibold text-gray-800",
		h4: "text-base font-medium text-gray-800",
		label: "text-xs font-medium text-gray-600",
		help: "text-xs text-gray-400",
	}
	return map[props.level] || "text-sm text-gray-700"
})
</script>
