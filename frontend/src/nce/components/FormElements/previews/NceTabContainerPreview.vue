<template>
	<div class="nce-tab-preview min-h-[60px] rounded border border-dashed border-gray-300 bg-white p-2">
		<div class="flex border-b border-gray-200 pb-1">
			<span
				v-for="(tab, idx) in displayTabs"
				:key="idx"
				class="mr-3 text-xs font-medium"
				:class="idx === 0 ? 'text-blue-600' : 'text-gray-400'"
			>
				{{ tab.label }}
			</span>
		</div>
		<div class="pt-2 text-xs text-gray-300">Tab content area</div>
		<slot name="default" />
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		tabs?: Array<{ label: string; fields?: string[]; condition?: string }>
	}>(),
	{
		tabs: () => [{ label: "Tab 1", fields: [] }],
	}
)

const displayTabs = computed(() => props.tabs || [{ label: "Tab 1" }])
</script>
