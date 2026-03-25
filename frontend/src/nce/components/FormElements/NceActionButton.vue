<template>
	<Button
		:variant="variant"
		:loading="isProcessing"
		@click="handleClick"
	>
		{{ label }}
	</Button>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Button } from "frappe-ui"
import { call } from "frappe-ui"
import { toast } from "vue-sonner"
import { useNceFormStore } from "@nce/stores"
import { useSaveAction } from "@nce/composables/useSaveAction"

const props = withDefaults(
	defineProps<{
		action?: "save" | "submit" | "cancel" | "method" | "navigate" | "custom"
		methodName?: string
		navigateTo?: string
		label?: string
		variant?: string
		confirmMessage?: string
	}>(),
	{
		action: "save",
		methodName: "",
		navigateTo: "",
		label: "Save",
		variant: "solid",
		confirmMessage: "",
	}
)

const nceFormStore = useNceFormStore()
const { handleSave, handleSubmit } = useSaveAction()
const isProcessing = ref(false)

async function handleClick() {
	if (props.confirmMessage) {
		if (!window.confirm(props.confirmMessage)) return
	}

	isProcessing.value = true
	try {
		switch (props.action) {
			case "save":
				await handleSave()
				break
			case "submit":
				await handleSubmit()
				break
			case "cancel":
				handleCancel()
				break
			case "method":
				await handleMethod()
				break
			case "navigate":
				handleNavigate()
				break
			case "custom":
				toast.info("Custom action not configured")
				break
		}
	} catch (err: any) {
		toast.error(err?.message || "Action failed")
	} finally {
		isProcessing.value = false
	}
}

function handleCancel() {
	nceFormStore.reset()
	toast.info("Changes discarded")
}

async function handleMethod() {
	if (!props.methodName) {
		toast.error("No method configured")
		return
	}
	if (!nceFormStore.targetDoctype || !nceFormStore.currentDocname) return
	await call("frappe.client.run_doc_method", {
		dt: nceFormStore.targetDoctype,
		dn: nceFormStore.currentDocname,
		method: props.methodName,
	})
	toast.success(`Method "${props.methodName}" executed`)
	await nceFormStore.loadRecord(nceFormStore.currentDocname)
}

function handleNavigate() {
	if (!props.navigateTo) {
		toast.error("No navigation target configured")
		return
	}
	window.location.href = props.navigateTo
}
</script>
