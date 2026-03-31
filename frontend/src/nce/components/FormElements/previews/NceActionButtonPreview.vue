<template>
	<div class="nce-btn-preview inline-block">
		<span
			class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium"
			:class="variantClasses"
		>
			{{ label || "Submit" }}
			<span class="ml-1 text-[10px] opacity-60">({{ action }})</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		action?: string
		label?: string
		variant?: string
		methodName?: string
		navigateTo?: string
		confirmMessage?: string
	}>(),
	{
		action: "save",
		label: "Submit",
		variant: "solid",
	}
)

const variantClasses = computed(() => {
	const map: Record<string, string> = {
		solid: "bg-blue-500 text-white",
		outline: "border border-gray-300 text-gray-700",
		ghost: "text-gray-600",
		subtle: "bg-gray-100 text-gray-700",
	}
	return map[props.variant || "solid"] || map.solid
})
</script>
