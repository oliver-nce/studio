<template>
	<div class="nce-form-header flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
		<!-- Form title -->
		<h1 class="flex-1 text-lg font-bold text-gray-900">
			{{ formTitle }}
		</h1>

		<!-- Record selector -->
		<Autocomplete
			v-if="targetDoctype"
			:options="recordOptions"
			:modelValue="currentDocname"
			@update:modelValue="handleRecordSelect"
			placeholder="Select a record…"
			class="w-48"
			:loading="isLoadingRecords"
		/>

		<!-- Random button -->
		<Button
			v-if="targetDoctype && !isLoadingRecords"
			variant="subtle"
			size="sm"
			icon="shuffle"
			@click="handleRandomRecord"
			title="Random record"
		/>

		<!-- Lock status badge -->
		<Badge
			v-if="lockStatusText"
			:variant="lockStatusVariant"
			size="sm"
		>
			{{ lockStatusText }}
		</Badge>

		<!-- Dirty indicator -->
		<Badge
			v-if="isDirty && dirtyCount > 0"
			variant="yellow"
			size="sm"
		>
			● {{ dirtyCount }} unsaved
		</Badge>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import { Autocomplete, Button, Badge, FeatherIcon, call } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"
import { getRandomDocName } from "@nce/utils/dataPipeline"
import { toast } from "vue-sonner"

const nceFormStore = useNceFormStore()

const recordOptions = ref<Array<{ label: string; value: string }>>([])
const isLoadingRecords = ref(false)

// Form title from definition
const formTitle = computed(() => nceFormStore.formDefinition?.form_title ?? "Form")

// Target DocType
const targetDoctype = computed(() => nceFormStore.targetDoctype)

// Current record name
const currentDocname = computed(() => nceFormStore.currentDocname)

// Dirty state
const isDirty = computed(() => nceFormStore.isDirty)
const dirtyCount = computed(() => Object.keys(nceFormStore.dirtyFields).length)

// Lock status badge
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

// Fetch records for autocomplete
async function fetchRecords() {
	if (!targetDoctype.value) return

	isLoadingRecords.value = true
	recordOptions.value = []
	try {
		const result = await call("frappe.client.get_list", {
			doctype: targetDoctype.value,
			fields: ["name"],
			limit_page_length: 20,
			order_by: "creation desc",
		})
		recordOptions.value = (result || []).map((r: { name: string }) => ({
			label: r.name,
			value: r.name,
		}))
	} catch {
		recordOptions.value = []
	} finally {
		isLoadingRecords.value = false
	}
}

// Handle record selection
async function handleRecordSelect(value: string | null) {
	if (!value) return
	if (!targetDoctype.value) return

	try {
		await nceFormStore.loadRecord(value)
		await nceFormStore.acquireLock()
		toast.success(`Record loaded: ${value}`)
	} catch (err: any) {
		toast.error(err?.message || "Failed to load record")
	}
}

// Handle random record button
async function handleRandomRecord() {
	if (!targetDoctype.value) return

	isLoadingRecords.value = true
	try {
		const docname = await getRandomDocName(targetDoctype.value)
		if (docname) {
			await handleRecordSelect(docname)
		} else {
			toast.warning("No records found")
		}
	} catch (err: any) {
		toast.error(err?.message || "Failed to fetch random record")
	} finally {
		isLoadingRecords.value = false
	}
}

onMounted(() => {
	if (targetDoctype.value) {
		fetchRecords()
	}
})

watch(targetDoctype, () => {
	if (targetDoctype.value) {
		fetchRecords()
	}
})
</script>
