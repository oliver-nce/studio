<template>
	<div class="nce-tab-container">
		<div class="flex border-b border-gray-200">
			<button
				v-for="(tab, idx) in visibleTabs"
				:key="idx"
				class="px-4 py-2 text-sm font-medium transition-colors"
				:class="
					activeIndex === idx
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-500 hover:text-gray-700'
				"
				@click="activeIndex = idx"
			>
				{{ tab.label }}
			</button>
		</div>

		<div class="py-3">
			<slot :name="`tab-${activeIndex}`" :tab="visibleTabs[activeIndex]">
				<div class="text-xs text-gray-400">
					Tab content for "{{ visibleTabs[activeIndex]?.label }}"
				</div>
			</slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useNceFormStore } from "@nce/stores"
import type { TabDefinition } from "@nce/types"

const props = withDefaults(
	defineProps<{
		tabs?: TabDefinition[]
	}>(),
	{
		tabs: () => [{ label: "Tab 1", fields: [] }],
	}
)

const nceFormStore = useNceFormStore()
const activeIndex = ref(0)

const visibleTabs = computed(() => {
	return (props.tabs || []).filter((tab) => {
		if (!tab.condition) return true
		try {
			const formData = nceFormStore.getFormData()
			const fn = new Function("data", `return !!(${tab.condition})`)
			return fn(formData)
		} catch {
			return true
		}
	})
})

defineExpose({ activeIndex, visibleTabs })
</script>
