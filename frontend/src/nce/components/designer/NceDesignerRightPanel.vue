<template>
	<div class="flex h-full w-[275px] flex-col border-l bg-white">
		<template v-if="selectedBlock">
			<ComponentProperties :block="selectedBlock" />
		</template>
		<div v-else class="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-gray-400">
			<FeatherIcon name="mouse-pointer" class="h-8 w-8 text-gray-300" />
			<p class="text-center text-sm">
				Select a component on the canvas to edit its properties
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
/**
 * Right panel for the NCE Form Designer.
 *
 * Reuses Studio's ComponentProperties component directly. Since
 * ComponentProperties.vue already has built-in NCE PathFinder integration
 * (it checks isNceComponent() and renders PathFinder buttons for fieldPath,
 * action, and navigateTo props), we don't need any PathFinder-specific code
 * here — it works automatically as long as nceFormStore.targetDoctype is set.
 */
import { computed } from "vue"
import { FeatherIcon } from "frappe-ui"
import ComponentProperties from "@/components/ComponentProperties.vue"
import useCanvasStore from "@/stores/canvasStore"

const canvasStore = useCanvasStore()

const selectedBlock = computed(() => {
	const canvas = canvasStore.activeCanvas
	if (!canvas) return null
	const blocks = canvas.selectedBlocks
	return blocks?.length === 1 ? blocks[0] : null
})
</script>
