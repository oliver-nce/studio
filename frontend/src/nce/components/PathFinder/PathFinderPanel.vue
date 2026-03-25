<template>
	<div class="nce-pathfinder-panel flex h-full flex-col">
		<!-- DocType selector -->
		<div class="border-b border-gray-200 px-3 py-3">
			<label class="mb-1 block text-xs font-medium text-gray-500">Root DocType</label>
			<Autocomplete
				:options="doctypeOptions"
				:modelValue="selectedDoctype"
				@update:modelValue="handleDoctypeSelect"
				placeholder="Search DocType…"
				class="w-full"
			/>
		</div>

		<!-- Active form definition hint -->
		<div
			v-if="activeFormDoctype && activeFormDoctype !== selectedDoctype"
			class="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-3 py-1.5"
		>
			<FeatherIcon name="info" class="h-3 w-3 text-blue-500" />
			<span class="flex-1 text-[11px] text-blue-600">
				Page form uses <strong>{{ activeFormDoctype }}</strong>
			</span>
			<button
				class="rounded px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
				@click="selectedDoctype = activeFormDoctype"
			>
				Use
			</button>
		</div>

		<!-- PathFinder body -->
		<div class="flex-1 overflow-hidden">
			<PathFinderCore
				v-if="selectedDoctype"
				ref="pathFinderRef"
				:rootDoctype="selectedDoctype"
				mode="single"
				@path-selected="handlePathSelected"
			/>

			<!-- Empty state when no DocType selected -->
			<div
				v-else
				class="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center text-gray-400"
			>
				<FeatherIcon name="compass" class="h-10 w-10" />
				<div>
					<div class="text-sm font-medium text-gray-500">PathFinder</div>
					<div class="mt-1 text-xs">
						Choose a DocType above to navigate its fields and create data bindings.
					</div>
				</div>
			</div>
		</div>

		<!-- Footer: Insert Binding -->
		<div
			v-if="lastSelectedPath"
			class="border-t border-gray-200 bg-white px-3 py-2"
		>
			<div class="mb-1.5 flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1">
				<FeatherIcon name="link" class="h-3 w-3 text-gray-400" />
				<code class="flex-1 truncate font-mono text-xs text-gray-600">{{ lastSelectedPath }}</code>
				<button
					class="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
					@click="copyToClipboard"
					title="Copy path"
				>
					<FeatherIcon name="copy" class="h-3 w-3" />
				</button>
			</div>
			<div class="flex gap-2">
				<Button
					variant="solid"
					size="sm"
					class="flex-1"
					@click="insertBinding"
					:disabled="!canInsertBinding"
				>
					<template #prefix>
						<FeatherIcon name="plus-circle" class="h-3.5 w-3.5" />
					</template>
					Insert Binding
				</Button>
				<Button
					variant="subtle"
					size="sm"
					@click="insertAsExpression"
					:disabled="!canInsertBinding"
					title="Insert as {{ expression }}"
				>
					{{ '{{ }}' }}
				</Button>
			</div>
			<p v-if="!canInsertBinding" class="mt-1 text-[10px] text-gray-400">
				Select a block on the canvas to insert a binding
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { Autocomplete, FeatherIcon, Button } from "frappe-ui"
import { call } from "frappe-ui"
import { toast } from "vue-sonner"

import PathFinderCore from "./PathFinderCore.vue"
import useCanvasStore from "@/stores/canvasStore"
import useStudioStore from "@/stores/studioStore"

interface SelectOption {
	label: string
	value: string
}

const canvasStore = useCanvasStore()
const studioStore = useStudioStore()
const pathFinderRef = ref<InstanceType<typeof PathFinderCore> | null>(null)

// State
const selectedDoctype = ref("")
const lastSelectedPath = ref("")
const doctypeOptions = ref<SelectOption[]>([])

// Try to detect the active form's target DocType from the page context
const activeFormDoctype = computed(() => {
	// If the Studio page has an NCE form definition, extract its target doctype
	// This will be wired up more deeply in Phase 7
	return ""
})

// Whether we can insert into the currently selected block
const canInsertBinding = computed(() => {
	const canvas = canvasStore.activeCanvas
	if (!canvas) return false
	return canvas.selectedBlocks && canvas.selectedBlocks.length > 0
})

// Fetch available DocTypes for the autocomplete
async function fetchDoctypes() {
	try {
		const result = await call("frappe.client.get_list", {
			doctype: "DocType",
			filters: { istable: 0, issingle: 0 },
			fields: ["name"],
			order_by: "name asc",
			limit_page_length: 0,
		})
		doctypeOptions.value = (result || []).map((dt: { name: string }) => ({
			label: dt.name,
			value: dt.name,
		}))
	} catch {
		doctypeOptions.value = []
	}
}

function handleDoctypeSelect(option: SelectOption | string) {
	if (typeof option === "string") {
		selectedDoctype.value = option
	} else if (option?.value) {
		selectedDoctype.value = option.value
	}
	lastSelectedPath.value = ""
}

function handlePathSelected(path: string) {
	lastSelectedPath.value = path
}

/**
 * Insert the selected path as a variable binding on the active block's
 * most relevant prop (typically the first string-type prop, or `fieldPath`).
 */
function insertBinding() {
	if (!lastSelectedPath.value || !canInsertBinding.value) return

	const canvas = canvasStore.activeCanvas
	if (!canvas || !canvas.selectedBlocks?.length) return

	const block = canvas.selectedBlocks[0]

	// For NCE components, prefer `fieldPath` prop
	if (block.componentProps && "fieldPath" in block.componentProps) {
		block.setProp("fieldPath", lastSelectedPath.value)
		toast.success(`Bound fieldPath → ${lastSelectedPath.value}`)
		return
	}

	// For other components, insert as a variable binding expression
	// Use the first available string-type prop or fallback to setting as attribute
	block.setProp("fieldPath", lastSelectedPath.value)
	toast.success(`Set fieldPath → ${lastSelectedPath.value}`)
}

/**
 * Insert the path as a {{ variable.path }} expression.
 */
function insertAsExpression() {
	if (!lastSelectedPath.value || !canInsertBinding.value) return

	const canvas = canvasStore.activeCanvas
	if (!canvas || !canvas.selectedBlocks?.length) return

	const block = canvas.selectedBlocks[0]
	const expression = `{{ ${lastSelectedPath.value} }}`

	// Try to set it on the most suitable text prop
	if (block.componentProps && "text" in block.componentProps) {
		block.setProp("text", expression)
		toast.success(`Inserted expression on text prop`)
		return
	}

	if (block.componentProps && "label" in block.componentProps) {
		block.setProp("label", expression)
		toast.success(`Inserted expression on label prop`)
		return
	}

	// Fallback: set as an attribute
	block.setProp("fieldPath", lastSelectedPath.value)
	toast.success(`Set fieldPath → ${lastSelectedPath.value}`)
}

async function copyToClipboard() {
	try {
		await navigator.clipboard.writeText(lastSelectedPath.value)
		toast.success("Path copied to clipboard")
	} catch {
		toast.error("Failed to copy")
	}
}

onMounted(fetchDoctypes)
</script>
