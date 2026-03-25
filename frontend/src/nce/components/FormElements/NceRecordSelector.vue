<template>
	<template v-if="targetDoctype">
		<Autocomplete
			:options="recordOptions"
			:modelValue="currentDocname"
			@update:modelValue="handleRecordSelect"
			placeholder="Select a record…"
			class="w-48"
			:loading="isLoadingRecords"
		/>

		<Button
			v-if="!isLoadingRecords"
			variant="subtle"
			size="sm"
			icon="shuffle"
			@click="handleRandomRecord"
			title="Random record"
		/>
	</template>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import { Autocomplete, Button, call } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"
import { getRandomDocName } from "@nce/utils/dataPipeline"
import { toast } from "vue-sonner"

const nceFormStore = useNceFormStore()

const recordOptions = ref<Array<{ label: string; value: string }>>([])
const isLoadingRecords = ref(false)

const targetDoctype = computed(() => nceFormStore.targetDoctype)
const currentDocname = computed(() => nceFormStore.currentDocname)

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
