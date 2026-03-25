<template>
	<component
		:is="tagName"
		class="nce-caption"
		:class="levelClasses"
	>
		{{ resolvedText }}
	</component>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue"
import { useNceFormStore } from "@nce/stores"
import { useFieldMeta } from "@nce/composables/useFieldMeta"

const props = withDefaults(
	defineProps<{
		text?: string
		level?: "h1" | "h2" | "h3" | "h4" | "label" | "help"
		fieldPath?: string
	}>(),
	{
		text: "Caption",
		level: "label",
		fieldPath: "",
	}
)

const nceFormStore = useNceFormStore()
const { resolveNestedFieldMeta } = useFieldMeta()
const fieldLabel = ref("")

const tagName = computed(() => {
	const map: Record<string, string> = {
		h1: "h1",
		h2: "h2",
		h3: "h3",
		h4: "h4",
		label: "label",
		help: "p",
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

const resolvedText = computed(() => {
	if (fieldLabel.value) return fieldLabel.value
	return props.text
})

// Debounce timer to avoid rapid API calls when props change quickly
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isMounted = true

function debouncedResolveFieldLabel() {
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(resolveFieldLabel, 150)
}

async function resolveFieldLabel() {
	if (!isMounted) return
	if (!props.fieldPath || !nceFormStore.targetDoctype) return

	try {
		const meta = await resolveNestedFieldMeta(nceFormStore.targetDoctype, props.fieldPath)
		if (!isMounted) return
		if (meta?.label) {
			fieldLabel.value = meta.label
		}
	} catch {
		// Silent — fall back to props.text
	}
}

onMounted(resolveFieldLabel)
onUnmounted(() => {
	isMounted = false
	if (debounceTimer) clearTimeout(debounceTimer)
})
watch(() => props.fieldPath, debouncedResolveFieldLabel)
watch(() => nceFormStore.targetDoctype, debouncedResolveFieldLabel)
</script>
