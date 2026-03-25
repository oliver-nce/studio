<template>
	<div class="nce-portal-list flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<label class="text-xs font-medium text-gray-700">{{ fieldPath }}</label>
			<Button
				v-if="addRows && editable"
				variant="subtle"
				size="sm"
				icon="plus"
				@click="handleAddRow"
			>
				Add Row
			</Button>
		</div>

		<div v-if="!rows.length" class="rounded border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-400">
			No rows
		</div>

		<div v-else class="overflow-x-auto rounded border border-gray-200">
			<table class="w-full text-xs">
				<thead>
					<tr class="border-b bg-gray-50">
						<th class="px-3 py-2 text-left font-medium text-gray-600">#</th>
						<th
							v-for="col in displayColumns"
							:key="col"
							class="px-3 py-2 text-left font-medium text-gray-600"
						>
							{{ col }}
						</th>
						<th v-if="deleteRows && editable" class="w-8 px-3 py-2"></th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(row, rowIdx) in rows"
						:key="rowIdx"
						class="border-b border-gray-100 hover:bg-gray-50"
					>
						<td class="px-3 py-1.5 text-gray-400">{{ rowIdx + 1 }}</td>
						<td v-for="col in displayColumns" :key="col" class="px-3 py-1.5">
							<input
								v-if="editable"
								class="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
								:value="row[col]"
								@input="(e) => handleCellEdit(rowIdx, col, (e.target as HTMLInputElement).value)"
							/>
							<span v-else>{{ row[col] ?? '' }}</span>
						</td>
						<td v-if="deleteRows && editable" class="px-2">
							<Button variant="ghost" size="sm" icon="x" @click="handleDeleteRow(rowIdx)" />
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Button } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"

const HIDDEN_KEYS = new Set([
	"name",
	"idx",
	"doctype",
	"parent",
	"parenttype",
	"parentfield",
	"owner",
	"creation",
	"modified",
	"modified_by",
	"docstatus",
])

const props = withDefaults(
	defineProps<{
		fieldPath: string
		columns?: string[]
		editable?: boolean
		addRows?: boolean
		deleteRows?: boolean
	}>(),
	{
		fieldPath: "",
		columns: () => [],
		editable: true,
		addRows: true,
		deleteRows: true,
	}
)

const nceFormStore = useNceFormStore()

const rows = computed<Record<string, any>[]>(() => {
	const data = nceFormStore.getFieldValue(props.fieldPath)
	if (Array.isArray(data)) return data
	return []
})

const displayColumns = computed(() => {
	if (props.columns.length > 0) return props.columns
	if (rows.value.length > 0) {
		return Object.keys(rows.value[0]).filter(
			(k) => !k.startsWith("_") && !HIDDEN_KEYS.has(k)
		)
	}
	return []
})

function handleCellEdit(rowIdx: number, col: string, value: string) {
	const updated = [...rows.value]
	updated[rowIdx] = { ...updated[rowIdx], [col]: value }
	nceFormStore.setFieldValue(props.fieldPath, updated)
}

function handleAddRow() {
	const newRow: Record<string, any> = {}
	for (const col of displayColumns.value) {
		newRow[col] = ""
	}
	nceFormStore.setFieldValue(props.fieldPath, [...rows.value, newRow])
}

function handleDeleteRow(rowIdx: number) {
	const updated = rows.value.filter((_, i) => i !== rowIdx)
	nceFormStore.setFieldValue(props.fieldPath, updated)
}
</script>
