<template>
	<div class="flex h-screen flex-col bg-gray-100">
		<!-- Toolbar -->
		<NceDesignerToolbar
			:formDefinition="formDefinition"
			:isSaving="isSaving"
			@save="saveLayout"
			@preview="openPreview"
		/>

		<!-- Main area -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left panel: NCE component palette -->
			<NceDesignerLeftPanel />

			<!-- Canvas (reuses Studio's StudioCanvas as-is) -->
			<StudioCanvas
				v-if="rootBlock"
				ref="pageCanvas"
				class="canvas-container flex-1 overflow-hidden bg-gray-200 p-10"
				:componentTree="rootBlock"
				:canvasStyles="{ minHeight: '600px' }"
			/>
			<div v-else class="flex flex-1 items-center justify-center">
				<LoadingIndicator class="h-8 w-8" />
			</div>

			<!-- Right panel: Properties (includes PathFinder for NCE fields) -->
			<NceDesignerRightPanel />
		</div>
	</div>
</template>

<script setup lang="ts">
/**
 * NCE Form Designer — Canvas-based form layout editor.
 *
 * Reuses Frappe Studio's StudioCanvas for drag-drop block editing,
 * but scoped to NCE form components only (via the dedicated left panel).
 *
 * The right panel reuses Studio's ComponentProperties, which already has
 * built-in PathFinder integration for NCE components (any component whose
 * name starts with "Nce" and has props in NCE_PATH_PROPS gets PathFinder
 * buttons automatically).
 *
 * On "Save Layout", the block tree is serialised to JSON and stored in
 * NCE Form Definition.form_schema. A flat field_mapping is also extracted
 * for backward compatibility with the existing NceFormRuntime.
 */
import { ref, watchEffect, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { LoadingIndicator } from "frappe-ui"
import { call } from "frappe-ui"
import { toast } from "vue-sonner"

import StudioCanvas from "@/components/StudioCanvas.vue"
import { useCanvasStore } from "@/stores/canvasStore"
import { useNceFormStore } from "@nce/stores"
import {
	getBlockInstance,
	getBlockCopyWithoutParent,
	getRootBlock,
} from "@/utils/serializer"
import { getFormDefinition, getRandomDocName } from "@nce/utils/dataPipeline"
import type { FormDefinition } from "@nce/types"
import type Block from "@/utils/block"

import NceDesignerToolbar from "@nce/components/designer/NceDesignerToolbar.vue"
import NceDesignerLeftPanel from "@nce/components/designer/NceDesignerLeftPanel.vue"
import NceDesignerRightPanel from "@nce/components/designer/NceDesignerRightPanel.vue"

// ---------------------------------------------------------------------------
// Route & stores
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()
const canvasStore = useCanvasStore()
const nceFormStore = useNceFormStore()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const formDefinition = ref<FormDefinition | null>(null)
const rootBlock = ref<Block | null>(null)
const pageCanvas = ref<InstanceType<typeof StudioCanvas> | null>(null)
const isSaving = ref(false)

const formName = ref(route.params.formName as string)

// ---------------------------------------------------------------------------
// Canvas ↔ canvasStore wiring
// ---------------------------------------------------------------------------
// StudioCanvas does NOT set canvasStore.activeCanvas itself — the parent
// page must do it (same pattern as StudioPage.vue lines 183-198).
watchEffect(() => {
	if (pageCanvas.value) {
		canvasStore.activeCanvas = pageCanvas.value
	}
})

// ---------------------------------------------------------------------------
// Load form definition and initialise canvas
// ---------------------------------------------------------------------------
onMounted(async () => {
	try {
		// 1. Load form definition from DB
		const def = await getFormDefinition(formName.value)
		formDefinition.value = def

		// 2. Load into nceFormStore so ComponentProperties can read
		//    targetDoctype for the PathFinder integration
		await nceFormStore.loadForm(formName.value)

		// 3. Restore saved block tree, or start with a fresh root
		let savedSchema = def.form_schema
		if (typeof savedSchema === "string") {
			try {
				savedSchema = JSON.parse(savedSchema)
			} catch {
				savedSchema = null
			}
		}

		if (savedSchema && (savedSchema as any).componentId) {
			// Restore from saved block tree
			rootBlock.value = getBlockInstance(savedSchema as any, true)
		} else {
			// Start with a fresh empty root block
			rootBlock.value = getRootBlock()
		}
	} catch (err: any) {
		toast.error("Failed to load form: " + (err?.message || "Unknown error"))
	}
})

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
onUnmounted(() => {
	if (canvasStore.activeCanvas === pageCanvas.value) {
		canvasStore.activeCanvas = null
	}
})

// ---------------------------------------------------------------------------
// Save layout
// ---------------------------------------------------------------------------
async function saveLayout() {
	if (!pageCanvas.value || !formName.value) return

	isSaving.value = true
	try {
		const root = pageCanvas.value.getRootBlock()
		if (!root) throw new Error("No root block on canvas")

		// Serialise block tree (strips circular refs like parentBlock)
		const blockData = getBlockCopyWithoutParent(root)
		const blockJson = JSON.stringify(blockData)

		// Also extract flat field_mapping for backward compat with runtime
		const fieldMapping = extractFieldMapping(root)

		// Persist to NCE Form Definition
		await call("frappe.client.set_value", {
			doctype: "NCE Form Definition",
			name: formName.value,
			fieldname: "form_schema",
			value: blockJson,
		})
		await call("frappe.client.set_value", {
			doctype: "NCE Form Definition",
			name: formName.value,
			fieldname: "field_mapping",
			value: JSON.stringify(fieldMapping),
		})

		toast.success("Layout saved")
	} catch (err: any) {
		toast.error("Save failed: " + (err?.message || "Unknown error"))
	} finally {
		isSaving.value = false
	}
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------
async function openPreview() {
	await saveLayout()
	const doctype = formDefinition.value?.target_doctype
	let docname: string | null = null
	if (doctype) {
		try {
			docname = await getRandomDocName(doctype)
		} catch {
			// No records found — navigate without docname
		}
	}
	if (docname) {
		router.push({ name: "NceFormRuntime", params: { formName: formName.value, docname } })
	} else {
		router.push({ name: "NceFormRuntime", params: { formName: formName.value } })
		toast.info("No records found — select a record manually in the form")
	}
}

// ---------------------------------------------------------------------------
// Keyboard shortcut: Ctrl/Cmd + S
// ---------------------------------------------------------------------------
function onKeyDown(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key === "s") {
		e.preventDefault()
		saveLayout()
	}
}
onMounted(() => window.addEventListener("keydown", onKeyDown))
onUnmounted(() => window.removeEventListener("keydown", onKeyDown))

// ---------------------------------------------------------------------------
// Utility: extract flat field mapping from block tree
// ---------------------------------------------------------------------------
function extractFieldMapping(block: any): Record<string, string> {
	const mapping: Record<string, string> = {}

	function walk(b: any) {
		if (b.componentName === "NceFormField") {
			// Block instances expose getProp(); serialised objects have componentProps
			const fp = typeof b.getProp === "function"
				? b.getProp("fieldPath")
				: b.componentProps?.fieldPath
			if (fp) mapping[b.componentId] = fp
		}
		if (Array.isArray(b.children)) {
			for (const child of b.children) walk(child)
		}
		if (b.componentSlots) {
			for (const slot of Object.values(b.componentSlots)) {
				if (Array.isArray((slot as any).slotContent)) {
					for (const sc of (slot as any).slotContent) walk(sc)
				}
			}
		}
	}

	walk(block)
	return mapping
}
</script>

<style scoped>
.canvas-container {
	/* Match Studio's canvas positioning */
	position: relative;
}
</style>
