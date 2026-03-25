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

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			<!-- Save button -->
			<Button
				variant="solid"
				:loading="nceFormStore.isSaving"
				@click="handleSave"
			>
				Save
			</Button>

			<!-- Submit button (only for submit action) -->
			<Button
				v-if="submissionAction === 'Submit'"
				variant="solid"
				@click="handleSubmit"
			>
				Submit
			</Button>

			<!-- Custom API button (only for custom action) -->
			<Button
				v-if="submissionAction === 'Custom API'"
				variant="outline"
				@click="handleCustomApi"
			>
				Run API
			</Button>

			<!-- Workflow warning (only for workflow action) -->
			<span
				v-if="submissionAction === 'Workflow'"
				class="text-xs text-gray-500"
			>
				Workflow actions not yet implemented
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Button } from "frappe-ui"
import { toast } from "vue-sonner"
import { call } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"
import { useSaveAction } from "@nce/composables/useSaveAction"

const props = withDefaults(
	defineProps<{
		submissionAction?: "Save" | "Submit" | "Workflow" | "Custom API"
	}>(),
	{
		submissionAction: "Save",
	}
)

const nceFormStore = useNceFormStore()
const { handleSave, handleSubmit } = useSaveAction()

const isDirty = computed(() => nceFormStore.isDirty)

function handleDiscard() {
	nceFormStore.reset()
	toast.info("Changes discarded")
}

async function handleCustomApi() {
	if (!nceFormStore.targetDoctype || !nceFormStore.currentDocname) {
		toast.error("No record loaded")
		return
	}

	const endpoint = nceFormStore.formDefinition?.custom_api_endpoint
	if (!endpoint) {
		toast.error("No API endpoint configured")
		return
	}

	try {
		const formData = nceFormStore.getFormData()
		const result = await call(endpoint, {
			doctype: nceFormStore.targetDoctype,
			docname: nceFormStore.currentDocname,
			...formData,
		})
		toast.success("Custom API executed successfully")
		if (result?.message) {
			toast.info(result.message)
		}
	} catch (err: any) {
		toast.error(err?.message || "Custom API failed")
	}
}
</script>
