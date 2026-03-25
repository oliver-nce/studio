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

async function handleSave() {
	const success = await nceFormStore.save()
	if (success) {
		toast.success("Saved successfully")
	} else {
		toast.error("Save failed — check validation errors")
	}
}

async function handleSubmit() {
	const saved = await nceFormStore.save()
	if (!saved) {
		toast.error("Save failed — cannot submit")
		return
	}
	if (!nceFormStore.targetDoctype || !nceFormStore.currentDocname) return
	try {
		await call("frappe.client.submit", {
			doctype: nceFormStore.targetDoctype,
			name: nceFormStore.currentDocname,
		})
		toast.success("Submitted successfully")
		await nceFormStore.loadRecord(nceFormStore.currentDocname)
	} catch (err: any) {
		toast.error(err?.message || "Submit failed")
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
