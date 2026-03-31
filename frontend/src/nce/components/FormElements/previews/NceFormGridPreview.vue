<template>
	<div class="nce-grid-preview min-h-[60px] rounded border border-dashed border-gray-300 bg-gray-50 p-3">
		<div class="mb-1 text-xs font-medium text-gray-400">Form Grid</div>
		<div class="text-xs text-gray-300">
			{{ fields?.length || 0 }} field(s) &middot; {{ gridConfig?._columns || 2 }} columns
		</div>
		<slot name="default" />
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		fields?: string[]
		gridConfig?: Record<string, any>
	}>(),
	{
		fields: () => [],
		gridConfig: () => ({}),
	}
)
</script>
