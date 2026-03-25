<template>
	<Badge
		v-if="lockStatusText"
		:variant="lockStatusVariant"
		size="sm"
	>
		{{ lockStatusText }}
	</Badge>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Badge } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"

const nceFormStore = useNceFormStore()

const lockStatusText = computed(() => {
	if (!nceFormStore.currentDocname) return ""
	if (!nceFormStore.editLock.locked) return "🔓 Unlocked"
	if (nceFormStore.editLock.locked_by === window.frappe?.session?.user) {
		return "🔒 You"
	}
	return `🔒 ${nceFormStore.editLock.locked_by}`
})

const lockStatusVariant = computed(() => {
	if (!nceFormStore.currentDocname) return "light"
	if (!nceFormStore.editLock.locked) return "light"
	if (nceFormStore.editLock.locked_by === window.frappe?.session?.user) {
		return "green"
	}
	return "red"
})
</script>
