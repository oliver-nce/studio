<template>
	<div class="nce-form-header flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
		<!-- Form title -->
		<h1 class="flex-1 text-lg font-bold text-gray-900">
			{{ formTitle }}
		</h1>

		<!-- Record selector + random button -->
		<NceRecordSelector />

		<!-- Lock status badge -->
		<NceLockBadge />

		<!-- Dirty indicator -->
		<NceDirtyBadge />
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useNceFormStore } from "@nce/stores"
import NceRecordSelector from "./NceRecordSelector.vue"
import NceLockBadge from "./NceLockBadge.vue"
import NceDirtyBadge from "./NceDirtyBadge.vue"

const nceFormStore = useNceFormStore()

const formTitle = computed(() => nceFormStore.formDefinition?.form_title ?? "Form")
</script>
