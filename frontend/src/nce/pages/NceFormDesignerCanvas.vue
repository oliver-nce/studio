<template>
	<div class="studio isolate h-screen flex-col overflow-hidden bg-gray-100">
		<ComponentContextMenu ref="componentContextMenu"></ComponentContextMenu>
		<NceDesignerToolbar
			class="relative z-30"
			:formDefinition="formDefinition"
			:isSaving="isSaving"
			@save="saveLayout"
			@preview="openPreview"
		/>
		<div class="flex flex-col">
			<StudioLeftPanel
				class="absolute bottom-0 left-0 top-[var(--toolbar-height)] z-20 overflow-auto bg-white"
			/>

			<StudioCanvas
				v-show="!canvasStore.showFragmentCanvas || !canvasStore.fragmentData.block"
				ref="pageCanvas"
				v-if="rootBlock"
				class="canvas-container absolute bottom-0 top-[var(--toolbar-height)] flex justify-center overflow-hidden bg-gray-200 p-10"
				:componentTree="rootBlock"
				:canvas-styles="{
					minHeight: '1000px',
				}"
				:style="{
					left: `${store.studioLayout.showLeftPanel ? store.studioLayout.leftPanelWidth : 0}px`,
					right: `${store.studioLayout.showRightPanel ? store.studioLayout.rightPanelWidth : 0}px`,
				}"
			/>

			<div
				v-if="!rootBlock"
				class="absolute bottom-0 top-[var(--toolbar-height)] flex items-center justify-center"
				:style="{
					left: `${store.studioLayout.showLeftPanel ? store.studioLayout.leftPanelWidth : 0}px`,
					right: `${store.studioLayout.showRightPanel ? store.studioLayout.rightPanelWidth : 0}px`,
				}"
			>
				<LoadingIndicator class="h-8 w-8" />
			</div>

			<StudioRightPanel
				class="no-scrollbar dark:bg-zinc-900 absolute bottom-0 right-0 top-[var(--toolbar-height)] z-20 overflow-auto border-l-[1px] bg-white shadow-lg dark:border-gray-800"
			/>
		</div>

		<Dialog
			v-model="canvasStore.showHTMLDialog"
			class="overscroll-none"
			:options="{
				title: `Edit HTML - ${canvasStore.editableBlock?.componentName}`,
				size: '7xl',
			}"
		>
			<template #body-content>
				<Code
					:modelValue="canvasStore.editableBlock?.getHTML()"
					language="html"
					label="Edit HTML"
					:showLineNumbers="true"
					:showSaveButton="true"
					@save="
						(val: string) => {
							canvasStore.editableBlock?.setHTML(val)
							canvasStore.closeHTMLDialog()
						}
					"
					height="500px"
					max-height="500px"
					required
				/>
			</template>
		</Dialog>

		<Dialog
			v-model="canvasStore.showCodeDialog"
			class="overscroll-none"
			:options="{
				title: `Edit ${canvasStore.editableBlock?.componentName} prop - ${canvasStore.editableCode.propName}`,
				size: '7xl',
			}"
		>
			<template #body-content>
				<Code
					:modelValue="canvasStore.editableCode.code"
					language="javascript"
					label="Edit Code"
					:showLineNumbers="true"
					:showSaveButton="true"
					@save="
						(val: string) => {
							canvasStore.editableBlock?.setProp(canvasStore.editableCode.propName, val)
							canvasStore.showCodeDialog = false
						}
					"
					:emitOnChange="true"
					height="500px"
					max-height="500px"
					required
				/>
			</template>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
/**
 * NCE Form Designer — Canvas-based form layout editor.
 *
 * Uses the REAL Frappe Studio layout components (StudioLeftPanel, StudioRightPanel,
 * StudioCanvas) with the same absolute-positioned layout as StudioPage.vue.
 *
 * The only custom component is NceDesignerToolbar, which replaces StudioToolbar
 * with form-specific actions (Save Layout, Preview, Back) while visually matching
 * the Studio toolbar style.
 *
 * StudioLeftPanel provides: component palette, layers, PathFinder tabs.
 * StudioRightPanel provides: ComponentProperties (with built-in NCE PathFinder
 * integration), Styles, Events tabs.
 * StudioCanvas provides: the drag-drop block editor.
 *
 * On "Save Layout", the block tree is serialised to JSON and stored in
 * NCE Form Definition.form_schema. A flat field_mapping is also extracted
 * for backward compatibility with the existing NceFormRuntime.
 */
import { ref, watchEffect, onMounted, onUnmounted, nextTick, toRef } from "vue"
import { useRoute, useRouter } from "vue-router"
import { LoadingIndicator, Dialog } from "frappe-ui"
import { call } from "frappe-ui"
import { toast } from "vue-sonner"

import ComponentContextMenu from "@/components/ComponentContextMenu.vue"
import StudioLeftPanel from "@/components/StudioLeftPanel.vue"
import StudioRightPanel from "@/components/StudioRightPanel.vue"
import StudioCanvas from "@/components/StudioCanvas.vue"
import Code from "@/components/Code.vue"

import useStudioStore from "@/stores/studioStore"
import useCanvasStore from "@/stores/canvasStore"
import { useStudioEvents } from "@/utils/useStudioEvents"
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

// ---------------------------------------------------------------------------
// Route & stores
// ---------------------------------------------------------------------------
const route = useRoute()
const router = useRouter()
const store = useStudioStore()
const canvasStore = useCanvasStore()
const nceFormStore = useNceFormStore()

// Wire component context menu to studioStore (same as StudioPage.vue)
const componentContextMenu = toRef(store, "componentContextMenu")

// Wire up Studio keyboard events (Delete/Backspace, Ctrl+C/V/D, etc.)
useStudioEvents()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const formDefinition = ref<FormDefinition | null>(null)
const rootBlock = ref<Block | null>(null)
const pageCanvas = ref<InstanceType<typeof StudioCanvas> | null>(null)
const isSaving = ref(false)

const formName = ref(route.params.formName as string)

// ---------------------------------------------------------------------------
// Canvas ↔ canvasStore wiring (same pattern as StudioPage.vue)
// ---------------------------------------------------------------------------
watchEffect(() => {
	if (pageCanvas.value) {
		canvasStore.activeCanvas = pageCanvas.value
	}
})

// Set editing mode to "page" so the right panel shows the correct tabs
onMounted(() => {
	canvasStore.editingMode = "page"
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

<style>
.studio {
	--toolbar-height: 3.5rem;
}
</style>
