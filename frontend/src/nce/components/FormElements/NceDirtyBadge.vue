<template>
	<Badge
		v-if="isDirty && dirtyCount > 0"
		variant="yellow"
		size="sm"
	>
		● {{ dirtyCount }} unsaved
	</Badge>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Badge } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"

const nceFormStore = useNceFormStore()

const isDirty = computed(() => nceFormStore.isDirty)
const dirtyCount = computed(() => Object.keys(nceFormStore.dirtyFields).length)
</script>
