<template>
	<div class="nce-form-action-bar sticky bottom-0 z-10 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
		<!-- Discard button (only when dirty) -->
		<Button
			v-if="isDirty"
			variant="ghost"
			@click="handleDiscard"
		>
			Discard
		</Button>

		<!-- Save button -->
		<div class="flex items-center gap-2">
			<Button
				variant="solid"
				:loading="nceFormStore.isSaving"
				@click="handleSave"
			>
				Save
			</Button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Button } from "frappe-ui"
import { toast } from "vue-sonner"
import { useNceFormStore } from "@nce/stores"
import { useSaveAction } from "@nce/composables/useSaveAction"

const nceFormStore = useNceFormStore()
const { handleSave } = useSaveAction()

const isDirty = computed(() => nceFormStore.isDirty)

function handleDiscard() {
	nceFormStore.reset()
	toast.info("Changes discarded")
}
</script>
