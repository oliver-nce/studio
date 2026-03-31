# NCE Form Designer — Stage-Based Implementation Plan (v2)

> **For:** Claude Code implementation agent
> **Generated:** 2026-03-31 | Based on full codebase read of every file involved
>
> **How to use this plan:** Implement one stage at a time. After each stage, stop
> and let the user test. Only proceed to the next stage when asked. Commit after
> each stage with a descriptive message.

---

## Critical Context (read first)

### How StudioCanvas works

`StudioCanvas.vue` accepts two props:

```typescript
defineProps({
  componentTree: { type: Block, required: true },  // Must be a Block instance, NOT plain JSON
  canvasStyles: { type: Object, default: () => ({}) },
})
```

It exposes via `defineExpose`:
```typescript
{
  history, rootComponent, canvasProps,
  findBlock, removeBlock, getRootBlock, setRootBlock,
  hoveredBlock, hoveredBreakpoint, activeBreakpoint,
  setHoveredBlock, setHoveredBreakpoint, setActiveBreakpoint,
  selectedBlockIds, selectedBlocks, selectBlock, scrollBlockIntoView,
  selectBlockById, clearSelection, isRootSelected,
  selectedSlot, selectSlot, activeSlotIds,
}
```

It provides to children: `provide("canvasProps", canvasProps)`

The canvas renders blocks via `StudioComponent.vue`, which uses `<component :is="block.componentName">` — resolved through Vue's **global component registry** (`app.component(...)` in `globals.ts`).

### How the component palette works

Components are registered in two places:
1. **Block registry:** `Block.setComponents(COMPONENTS)` in `main.ts` line 18. The `Block` constructor reads `initialState` and `initialSlots` from this registry.
2. **Vue global registry:** `registerGlobalComponents(app)` in `globals.ts`. This is what makes `<component :is="NceFormField">` resolve at runtime.

When a component is dragged from the palette, `canvasStore.handleDragStart(ev, componentName)` sets `dataTransfer.componentName`. On drop, the canvas calls `getComponentBlock(componentName)` from `serializer.ts`, which creates a `Block` instance using the registry's `initialState`.

### How ComponentProperties already handles NCE components

**Key discovery:** `ComponentProperties.vue` already has PathFinder integration. Lines 8-30 render PathFinder buttons for NCE components:
- `isNceComponent()` returns `true` if `componentName.startsWith("Nce")`
- `NCE_PATH_PROPS = new Set(["fieldPath", "action", "navigateTo"])` — these props get PathFinder buttons
- It reads the target doctype from `nceFormStore`
- On path selection, it calls `block.setProp(propName, value)`

**This means Stage 3 is mostly done for free** — we just need the designer page to initialize `nceFormStore` with the form definition so `targetDoctype` is available.

### How NceFormField works in runtime

`NceFormField.vue` calls `useNceFormStore()` on mount (line 118) and reads values via `nceFormStore.getFieldValue(props.fieldPath)` (line 154). On mount, it calls `resolveNestedFieldMeta(nceFormStore.targetDoctype, props.fieldPath)` to fetch field metadata.

**Problem for canvas mode:** In the designer, `nceFormStore` won't have a loaded record — `targetDoctype` may be empty, `getFieldValue` returns undefined, and `resolveFieldMeta` will silently fail. The component won't crash (it has try/catch guards), but it will render empty. **This is fine for design time** — but we should use proxy components for a better preview experience.

### Block tree JSON shape (what gets saved to form_schema)

```json
{
  "componentId": "root",
  "componentName": "div",
  "blockName": "body",
  "originalElement": "body",
  "baseStyles": { "display": "flex", "flexDirection": "column", "width": "inherit", "height": "100%" },
  "children": [
    {
      "componentId": "NceFormField-a1b2c3",
      "componentName": "NceFormField",
      "blockName": "NceFormField",
      "componentProps": { "fieldPath": "customer_name", "label": "Customer Name", "editable": true },
      "baseStyles": {},
      "tabletStyles": {},
      "mobileStyles": {},
      "children": [],
      "componentSlots": {}
    }
  ],
  "componentSlots": {}
}
```

### Existing file paths (confirmed)

```
frontend/src/globals.ts                          — Vue global component registration
frontend/src/main.ts                             — Block.setComponents + app bootstrap
frontend/src/data/components.ts                  — COMPONENTS palette registry
frontend/src/router/studio_router.ts             — Routes
frontend/src/pages/StudioPage.vue                — Studio page builder (DO NOT MODIFY)
frontend/src/components/StudioCanvas.vue          — Canvas engine (DO NOT MODIFY)
frontend/src/components/ComponentProperties.vue   — Already has NCE PathFinder integration
frontend/src/utils/serializer.ts                 — getBlockInstance, getBlockCopyWithoutParent, jsToJson
frontend/src/utils/block.ts                      — Block class
frontend/src/stores/canvasStore.ts               — Canvas interaction state
frontend/src/stores/studioStore.ts               — Page/app state

frontend/src/nce/components/FormElements/NceFormField.vue
frontend/src/nce/components/FormElements/NceFormGrid.vue
frontend/src/nce/components/FormElements/NceTabContainer.vue
frontend/src/nce/components/FormElements/NceFormActionBar.vue
frontend/src/nce/components/FormElements/NceCaption.vue
frontend/src/nce/components/FormElements/NceActionButton.vue
frontend/src/nce/components/PathFinder/PathFinderCore.vue
frontend/src/nce/pages/NceFormRuntime.vue
frontend/src/nce/pages/NceFormDesigner.vue        — OLD designer (will be replaced)
frontend/src/nce/stores/nceFormStore.ts
frontend/src/nce/stores/nceFormDesignerStore.ts   — OLD designer store
frontend/src/nce/stores/index.ts                  — Store barrel exports
frontend/src/nce/composables/useFieldMeta.ts
frontend/src/nce/composables/useFormSchema.ts
frontend/src/nce/utils/dataPipeline.ts            — API calls (uses "studio.api.nce_api" base)
frontend/src/nce/utils/formBinding.ts
frontend/src/nce/utils/schemaHelpers.ts
frontend/src/nce/types/index.ts
```

---

## Stage 1 — Register NCE Components in Studio Engine

**Goal:** Make all 6 NCE form components known to the Studio block system so they can be instantiated via drag-drop, rendered on the canvas, and have their props edited.

**After this stage:** Existing Studio pages work unchanged. If you manually add an NCE component to a Studio page, it renders. The dedicated designer page comes in Stage 2.

---

### Step 1.1 — Create NCE component palette definitions

**File:** `frontend/src/nce/data/nceComponents.ts` — **NEW**

Create this file with the exact content below. Each entry must match the `FrappeUIComponent` interface from `frontend/src/types/index.ts`.

```typescript
import type { FrappeUIComponent } from "@/types"
import {
	LucideFormInput,
	LucideLayoutGrid,
	LucideColumns3,
	LucideSave,
	LucideType,
	LucideMousePointerClick,
} from "lucide-vue-next"

/**
 * NCE form component definitions for the Studio block system.
 * These are merged into the global COMPONENTS registry so that
 * Block.setComponents() can look up initialState when creating blocks.
 */
export const NCE_COMPONENTS: Record<string, FrappeUIComponent> = {
	NceFormField: {
		name: "NceFormField",
		title: "Form Field",
		icon: LucideFormInput,
		initialState: {
			fieldPath: "",
			fieldType: "",
			label: "",
			editable: true,
			placeholder: "",
			required: false,
		},
		// fieldPath is handled by ComponentProperties.vue's built-in
		// NCE PathFinder integration (isNcePathProp check).
		// Hide fieldType since it's auto-resolved from fieldPath metadata.
		hideProps: ["fieldType"],
	},

	NceFormGrid: {
		name: "NceFormGrid",
		title: "Form Grid",
		icon: LucideLayoutGrid,
		initialState: {
			fields: [],
			gridConfig: {},
		},
		// NceFormGrid renders children in a CSS grid.
		// In canvas mode, we want it to act as a drop container.
		initialSlots: ["default"],
	},

	NceTabContainer: {
		name: "NceTabContainer",
		title: "Tab Container",
		icon: LucideColumns3,
		initialState: {
			tabs: [{ label: "Tab 1", fields: [], condition: "" }],
		},
		initialSlots: ["default"],
	},

	NceFormActionBar: {
		name: "NceFormActionBar",
		title: "Action Bar",
		icon: LucideSave,
		initialState: {},
	},

	NceCaption: {
		name: "NceCaption",
		title: "Caption",
		icon: LucideType,
		initialState: {
			text: "Caption text",
			level: "label",
			fieldPath: "",
		},
		overrideProps: {
			level: {
				type: "string",
				inputType: "select",
				options: ["h1", "h2", "h3", "h4", "label", "help"],
			},
		},
	},

	NceActionButton: {
		name: "NceActionButton",
		title: "Action Button",
		icon: LucideMousePointerClick,
		initialState: {
			action: "save",
			methodName: "",
			navigateTo: "",
			label: "Submit",
			variant: "solid",
			confirmMessage: "",
		},
		overrideProps: {
			action: {
				type: "string",
				inputType: "select",
				options: ["save", "submit", "cancel", "method", "navigate", "custom"],
			},
			variant: {
				type: "string",
				inputType: "select",
				options: ["solid", "outline", "ghost", "subtle"],
			},
		},
	},
}
```

---

### Step 1.2 — Register NCE components in Vue's global registry

**File:** `frontend/src/globals.ts` — **EDIT**

Add these imports after the existing Studio component imports (after line 67):

```typescript
// NCE form components
import NceFormField from "@/nce/components/FormElements/NceFormField.vue"
import NceFormGrid from "@/nce/components/FormElements/NceFormGrid.vue"
import NceTabContainer from "@/nce/components/FormElements/NceTabContainer.vue"
import NceFormActionBar from "@/nce/components/FormElements/NceFormActionBar.vue"
import NceCaption from "@/nce/components/FormElements/NceCaption.vue"
import NceActionButton from "@/nce/components/FormElements/NceActionButton.vue"
```

Add these registrations inside `registerGlobalComponents(app)`, after line 135 (after `app.component("MarkdownEditor", MarkdownEditor)`):

```typescript
	// NCE form components
	app.component("NceFormField", NceFormField)
	app.component("NceFormGrid", NceFormGrid)
	app.component("NceTabContainer", NceTabContainer)
	app.component("NceFormActionBar", NceFormActionBar)
	app.component("NceCaption", NceCaption)
	app.component("NceActionButton", NceActionButton)
```

---

### Step 1.3 — Merge NCE components into Block registry

**File:** `frontend/src/main.ts` — **EDIT**

After line 14 (`import { COMPONENTS } from "@/data/components"`), add:

```typescript
import { NCE_COMPONENTS } from "@/nce/data/nceComponents"
```

Replace line 18 (`Block.setComponents(COMPONENTS)`) with:

```typescript
Block.setComponents({ ...COMPONENTS, ...NCE_COMPONENTS })
```

---

### Step 1.4 — Create canvas preview components for each NCE component

In the designer canvas, we don't want the real `NceFormField` (which calls `useNceFormStore()` and tries to resolve live data). Instead, each NCE component gets a lightweight **proxy preview** that shows a static representation.

**Note:** The `proxyComponent` field in the component registry tells `StudioComponent.vue` to render the proxy instead of the real component when in edit mode. Check how `StudioComponent.vue` uses `block.getProxyComponent()` — if `canvasStore.editingMode !== "page"`, the proxy is used. However, in our designer we ARE in "page" editing mode on the canvas, so proxies may not activate automatically. If that's the case, we'll need to set `editInFragmentMode: true` on each NCE component entry instead. **Test this in Stage 1 verification and adjust if needed.**

**Alternative approach if proxies don't activate:** Register the preview components as the global components (in globals.ts) instead of the real ones, and only import the real ones in `NceFormRuntime.vue` and `BlockTreeRenderer.vue` (Stage 5) via local imports. This guarantees the canvas always gets the preview and the runtime always gets the real component.

#### File: `frontend/src/nce/components/FormElements/previews/NceFormFieldPreview.vue` — **NEW**

```vue
<template>
	<div class="nce-field-preview rounded border border-dashed border-gray-300 bg-white p-2">
		<label class="mb-1 block text-xs font-medium text-gray-600">
			{{ displayLabel }}
			<span v-if="required" class="text-red-500">*</span>
		</label>
		<div class="rounded bg-gray-50 px-2 py-1.5 text-sm text-gray-400">
			<template v-if="fieldPath">
				<code class="font-mono text-xs text-blue-600">{{ fieldPath }}</code>
			</template>
			<template v-else>
				<span class="italic">No field bound — use PathFinder →</span>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		fieldPath?: string
		fieldType?: string
		label?: string
		editable?: boolean
		placeholder?: string
		required?: boolean
	}>(),
	{
		fieldPath: "",
		fieldType: "",
		label: "",
		editable: true,
		placeholder: "",
		required: false,
	}
)

const displayLabel = computed(() => {
	if (props.label) return props.label
	if (props.fieldPath) {
		// "customer.address.city" → "city"
		const segments = props.fieldPath.split(".")
		return segments[segments.length - 1]
	}
	return "Untitled Field"
})
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/NceFormGridPreview.vue` — **NEW**

```vue
<template>
	<div class="nce-grid-preview min-h-[60px] rounded border border-dashed border-gray-300 bg-gray-50 p-3">
		<div class="mb-1 text-xs font-medium text-gray-400">Form Grid</div>
		<div class="text-xs text-gray-300">
			{{ fields?.length || 0 }} field(s) · {{ gridConfig?._columns || 2 }} columns
		</div>
		<slot name="default" />
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		fields?: string[]
		gridConfig?: Record<string, any>
	}>(),
	{
		fields: () => [],
		gridConfig: () => ({}),
	}
)
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/NceTabContainerPreview.vue` — **NEW**

```vue
<template>
	<div class="nce-tab-preview min-h-[60px] rounded border border-dashed border-gray-300 bg-white p-2">
		<div class="flex border-b border-gray-200 pb-1">
			<span
				v-for="(tab, idx) in displayTabs"
				:key="idx"
				class="mr-3 text-xs font-medium"
				:class="idx === 0 ? 'text-blue-600' : 'text-gray-400'"
			>
				{{ tab.label }}
			</span>
		</div>
		<div class="pt-2 text-xs text-gray-300">Tab content area</div>
		<slot name="default" />
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		tabs?: Array<{ label: string; fields?: string[]; condition?: string }>
	}>(),
	{
		tabs: () => [{ label: "Tab 1", fields: [] }],
	}
)

const displayTabs = computed(() => props.tabs || [{ label: "Tab 1" }])
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/NceFormActionBarPreview.vue` — **NEW**

```vue
<template>
	<div class="nce-actionbar-preview flex items-center justify-between rounded border border-dashed border-gray-300 bg-white px-4 py-2">
		<span class="text-xs text-gray-400">Discard</span>
		<span class="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white">Save</span>
	</div>
</template>

<script setup lang="ts">
// No props needed — this is a static preview
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/NceCaptionPreview.vue` — **NEW**

```vue
<template>
	<component :is="tagName" :class="levelClasses">
		{{ text || "Caption text" }}
	</component>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		text?: string
		level?: "h1" | "h2" | "h3" | "h4" | "label" | "help"
		fieldPath?: string
	}>(),
	{
		text: "Caption text",
		level: "label",
		fieldPath: "",
	}
)

const tagName = computed(() => {
	const map: Record<string, string> = { h1: "h1", h2: "h2", h3: "h3", h4: "h4", label: "label", help: "p" }
	return map[props.level] || "span"
})

const levelClasses = computed(() => {
	const map: Record<string, string> = {
		h1: "text-2xl font-bold text-gray-900",
		h2: "text-xl font-semibold text-gray-900",
		h3: "text-lg font-semibold text-gray-800",
		h4: "text-base font-medium text-gray-800",
		label: "text-xs font-medium text-gray-600",
		help: "text-xs text-gray-400",
	}
	return map[props.level] || "text-sm text-gray-700"
})
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/NceActionButtonPreview.vue` — **NEW**

```vue
<template>
	<div class="nce-btn-preview inline-block">
		<span
			class="inline-flex items-center rounded px-3 py-1.5 text-xs font-medium"
			:class="variantClasses"
		>
			{{ label || "Submit" }}
			<span class="ml-1 text-[10px] opacity-60">({{ action }})</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
	defineProps<{
		action?: string
		label?: string
		variant?: string
		methodName?: string
		navigateTo?: string
		confirmMessage?: string
	}>(),
	{
		action: "save",
		label: "Submit",
		variant: "solid",
	}
)

const variantClasses = computed(() => {
	const map: Record<string, string> = {
		solid: "bg-blue-500 text-white",
		outline: "border border-gray-300 text-gray-700",
		ghost: "text-gray-600 hover:bg-gray-100",
		subtle: "bg-gray-100 text-gray-700",
	}
	return map[props.variant || "solid"] || map.solid
})
</script>
```

#### File: `frontend/src/nce/components/FormElements/previews/index.ts` — **NEW**

```typescript
export { default as NceFormFieldPreview } from "./NceFormFieldPreview.vue"
export { default as NceFormGridPreview } from "./NceFormGridPreview.vue"
export { default as NceTabContainerPreview } from "./NceTabContainerPreview.vue"
export { default as NceFormActionBarPreview } from "./NceFormActionBarPreview.vue"
export { default as NceCaptionPreview } from "./NceCaptionPreview.vue"
export { default as NceActionButtonPreview } from "./NceActionButtonPreview.vue"
```

---

### Step 1.5 — Register PREVIEW components as the global components (recommended approach)

**Why:** In the canvas, `StudioComponent.vue` renders `<component :is="NceFormField">`. If the real `NceFormField` is registered globally, it will call `useNceFormStore()` and fail/render empty in the designer. By registering the **previews** globally instead, the canvas always gets safe previews. The runtime (`NceFormRuntime.vue`) already imports the real components directly via local imports (see lines 73-76 of NceFormRuntime.vue), so it's unaffected.

**File:** `frontend/src/globals.ts` — **EDIT** (revise Step 1.2)

Instead of importing the real components, import the previews:

```typescript
// NCE form component previews (for canvas rendering)
import NceFormFieldPreview from "@/nce/components/FormElements/previews/NceFormFieldPreview.vue"
import NceFormGridPreview from "@/nce/components/FormElements/previews/NceFormGridPreview.vue"
import NceTabContainerPreview from "@/nce/components/FormElements/previews/NceTabContainerPreview.vue"
import NceFormActionBarPreview from "@/nce/components/FormElements/previews/NceFormActionBarPreview.vue"
import NceCaptionPreview from "@/nce/components/FormElements/previews/NceCaptionPreview.vue"
import NceActionButtonPreview from "@/nce/components/FormElements/previews/NceActionButtonPreview.vue"
```

Register them under the **real** component names (so `<component :is="NceFormField">` on the canvas resolves to the preview):

```typescript
	// NCE form components (preview versions for canvas)
	app.component("NceFormField", NceFormFieldPreview)
	app.component("NceFormGrid", NceFormGridPreview)
	app.component("NceTabContainer", NceTabContainerPreview)
	app.component("NceFormActionBar", NceFormActionBarPreview)
	app.component("NceCaption", NceCaptionPreview)
	app.component("NceActionButton", NceActionButtonPreview)
```

**Important:** This does NOT affect `NceFormRuntime.vue` because it imports the real components directly:
```typescript
// NceFormRuntime.vue line 73-76 (already exists, uses local imports)
import NceTabContainer from "@nce/components/FormElements/NceTabContainer.vue"
import NceFormGrid from "@nce/components/FormElements/NceFormGrid.vue"
import NceFormActionBar from "@/nce/components/FormElements/NceFormActionBar.vue"
```
Local imports take precedence over global registrations in Vue.

---

### Step 1.6 — Verify Stage 1

Run the dev server (`cd frontend && yarn dev` or equivalent).

**Tests:**
1. Open any existing Studio page builder (`/app/:appID/:pageID`). It must work exactly as before — no regressions.
2. Open the Studio left panel → "Add Component" tab. The NCE components should NOT appear here yet (they're in the Block registry but not in the standard palette's component list). This is correct — the dedicated palette comes in Stage 2.
3. Open browser console and run: `window.__APP_COMPONENTS__` — verify `NceFormField`, `NceFormGrid`, etc. are registered (they'll be the preview versions).
4. If you manually edit a Studio page's JSON to include a block with `componentName: "NceFormField"`, it should render the preview on the canvas.

**Stop here. Commit. Test. Then proceed to Stage 2.**

---

## Stage 2 — New Form Designer Page

**Goal:** Create the dedicated `/form-designer/:formName` page that reuses `StudioCanvas` with an NCE-only left panel.

**After this stage:** The designer loads, shows NCE components in a dedicated palette, drag-drop works on the canvas, and the right panel shows props + PathFinder for NceFormField blocks.

---

### Step 2.1 — Create the designer toolbar

**File:** `frontend/src/nce/components/designer/NceDesignerToolbar.vue` — **NEW**

```vue
<template>
	<div class="flex h-12 flex-shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" @click="$router.back()">
				<template #prefix>
					<FeatherIcon name="arrow-left" class="h-4 w-4" />
				</template>
				Back
			</Button>
			<span class="text-sm font-medium text-gray-700">
				{{ formDefinition?.form_title || "Form Designer" }}
			</span>
			<Badge v-if="formDefinition?.target_doctype" variant="subtle" size="sm">
				{{ formDefinition.target_doctype }}
			</Badge>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" @click="$emit('preview')">
				<template #prefix>
					<FeatherIcon name="eye" class="h-4 w-4" />
				</template>
				Preview
			</Button>
			<Button
				variant="solid"
				size="sm"
				:loading="isSaving"
				@click="$emit('save')"
			>
				<template #prefix>
					<FeatherIcon name="save" class="h-4 w-4" />
				</template>
				Save Layout
			</Button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Button, Badge, FeatherIcon } from "frappe-ui"
import type { FormDefinition } from "@nce/types"

defineProps<{
	formDefinition: FormDefinition | null
	isSaving: boolean
}>()

defineEmits<{
	save: []
	preview: []
}>()
</script>
```

---

### Step 2.2 — Create the NCE-only left panel (palette)

**File:** `frontend/src/nce/components/designer/NceDesignerLeftPanel.vue` — **NEW**

```vue
<template>
	<div class="flex h-full w-60 flex-col border-r bg-white">
		<div class="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-500">
			Form Components
		</div>
		<div class="flex-1 overflow-y-auto p-2">
			<div v-for="group in componentGroups" :key="group.label" class="mb-3">
				<div class="mb-1 px-1 text-[10px] font-semibold uppercase text-gray-400">
					{{ group.label }}
				</div>
				<div
					v-for="comp in group.components"
					:key="comp.name"
					class="mb-1 flex cursor-grab items-center gap-2 rounded border border-transparent px-2 py-1.5 text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50"
					draggable="true"
					@dragstart="(ev) => handleDragStart(ev, comp.name)"
				>
					<component :is="comp.icon" class="h-4 w-4 text-gray-400" />
					<span>{{ comp.title }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvasStore"
import { NCE_COMPONENTS } from "@/nce/data/nceComponents"

const canvasStore = useCanvasStore()

const componentGroups = [
	{
		label: "Fields",
		components: [NCE_COMPONENTS.NceFormField, NCE_COMPONENTS.NceCaption],
	},
	{
		label: "Layout",
		components: [NCE_COMPONENTS.NceFormGrid, NCE_COMPONENTS.NceTabContainer],
	},
	{
		label: "Actions",
		components: [NCE_COMPONENTS.NceFormActionBar, NCE_COMPONENTS.NceActionButton],
	},
]

function handleDragStart(ev: DragEvent, componentName: string) {
	canvasStore.handleDragStart(ev, componentName)
}
</script>
```

---

### Step 2.3 — Create the right panel

**File:** `frontend/src/nce/components/designer/NceDesignerRightPanel.vue` — **NEW**

This reuses `ComponentProperties` from Studio. Since `ComponentProperties.vue` already has built-in NCE PathFinder integration (it checks `isNceComponent()` and renders PathFinder buttons for `NCE_PATH_PROPS`), we don't need to add any PathFinder-specific code here.

```vue
<template>
	<div class="flex h-full w-[275px] flex-col border-l bg-white">
		<template v-if="selectedBlock">
			<ComponentProperties :block="selectedBlock" />
		</template>
		<div v-else class="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-gray-400">
			<FeatherIcon name="mouse-pointer" class="h-8 w-8 text-gray-300" />
			<p class="text-center text-sm">Select a component on the canvas to edit its properties</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { FeatherIcon } from "frappe-ui"
import ComponentProperties from "@/components/ComponentProperties.vue"
import { useCanvasStore } from "@/stores/canvasStore"

const canvasStore = useCanvasStore()

const selectedBlock = computed(() => {
	const canvas = canvasStore.activeCanvas
	if (!canvas) return null
	const blocks = canvas.selectedBlocks
	return blocks?.length === 1 ? blocks[0] : null
})
</script>
```

---

### Step 2.4 — Create the main designer page

**File:** `frontend/src/nce/pages/NceFormDesignerCanvas.vue` — **NEW**

This is the core file. It mirrors the essential setup from `StudioPage.vue` but for forms.

```vue
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
			<!-- Left panel: NCE palette -->
			<NceDesignerLeftPanel />

			<!-- Canvas -->
			<StudioCanvas
				v-if="rootBlock"
				ref="pageCanvas"
				class="flex-1 overflow-hidden bg-gray-200 p-10"
				:componentTree="rootBlock"
				:canvasStyles="{ minHeight: '600px' }"
			/>
			<div v-else class="flex flex-1 items-center justify-center">
				<LoadingIndicator class="h-8 w-8" />
			</div>

			<!-- Right panel: Properties -->
			<NceDesignerRightPanel />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { LoadingIndicator } from "frappe-ui"
import { call } from "frappe-ui"
import { toast } from "vue-sonner"
import StudioCanvas from "@/components/StudioCanvas.vue"
import { useCanvasStore } from "@/stores/canvasStore"
import { useNceFormStore } from "@nce/stores"
import { getFormDefinition } from "@nce/utils/dataPipeline"
import { getBlockInstance, getBlockCopyWithoutParent, getRootBlock } from "@/utils/serializer"
import type { FormDefinition } from "@nce/types"
import type Block from "@/utils/block"

import NceDesignerToolbar from "@nce/components/designer/NceDesignerToolbar.vue"
import NceDesignerLeftPanel from "@nce/components/designer/NceDesignerLeftPanel.vue"
import NceDesignerRightPanel from "@nce/components/designer/NceDesignerRightPanel.vue"

const route = useRoute()
const router = useRouter()
const canvasStore = useCanvasStore()
const nceFormStore = useNceFormStore()

// State
const formDefinition = ref<FormDefinition | null>(null)
const rootBlock = ref<Block | null>(null)
const pageCanvas = ref<InstanceType<typeof StudioCanvas> | null>(null)
const isSaving = ref(false)

// Form name from route
const formName = ref(route.params.formName as string)

// Load form definition and initialize canvas
onMounted(async () => {
	try {
		// Load form definition
		const def = await getFormDefinition(formName.value)
		formDefinition.value = def

		// Also load into nceFormStore so ComponentProperties can read targetDoctype
		// for the PathFinder integration
		await nceFormStore.loadForm(formName.value)

		// Restore saved block tree, or start with empty root
		let savedSchema = def.form_schema
		if (typeof savedSchema === "string") {
			try {
				savedSchema = JSON.parse(savedSchema)
			} catch {
				savedSchema = null
			}
		}

		if (savedSchema && savedSchema.componentId) {
			// Restore from saved block tree
			rootBlock.value = getBlockInstance(savedSchema, true)
		} else {
			// Start with a fresh root block
			rootBlock.value = getRootBlock()
		}

		// Register this canvas as active so canvasStore.activeCanvas works
		await nextTick()
		if (pageCanvas.value) {
			canvasStore.activeCanvas = pageCanvas.value
		}
	} catch (err: any) {
		toast.error("Failed to load form: " + (err?.message || "Unknown error"))
	}
})

// Clean up on unmount
onUnmounted(() => {
	if (canvasStore.activeCanvas === pageCanvas.value) {
		canvasStore.activeCanvas = null
	}
})

// Save layout to form_schema
async function saveLayout() {
	if (!pageCanvas.value || !formName.value) return

	isSaving.value = true
	try {
		const root = pageCanvas.value.getRootBlock()
		if (!root) throw new Error("No root block on canvas")

		// Serialize block tree (strips circular refs like parentBlock)
		const blockData = getBlockCopyWithoutParent(root)
		const blockJson = JSON.stringify(blockData)

		// Also extract flat field_mapping for backward compat with existing runtime
		const fieldMapping = extractFieldMapping(root)

		// Save to DB
		await call("frappe.client.set_value", {
			doctype: "NCE Form Definition",
			name: formName.value,
			fieldname: "form_schema",
			value: blockJson,
		})

		// Also save field_mapping for backward compat
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

// Navigate to runtime preview
async function openPreview() {
	await saveLayout()
	router.push({ name: "NceFormRuntime", params: { formName: formName.value } })
}

// Keyboard shortcut: Ctrl/Cmd + S to save
function onKeyDown(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key === "s") {
		e.preventDefault()
		saveLayout()
	}
}

onMounted(() => window.addEventListener("keydown", onKeyDown))
onUnmounted(() => window.removeEventListener("keydown", onKeyDown))

/**
 * Walk the block tree and extract all NceFormField fieldPath values
 * into a flat { componentId: fieldPath } mapping.
 */
function extractFieldMapping(block: any): Record<string, string> {
	const mapping: Record<string, string> = {}

	function walk(b: any) {
		if (b.componentName === "NceFormField") {
			const fp = b.componentProps?.fieldPath || b.getProp?.("fieldPath")
			if (fp) mapping[b.componentId] = fp
		}
		// Walk children
		if (Array.isArray(b.children)) {
			for (const child of b.children) walk(child)
		}
		// Walk slot children
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
```

**Gotcha — `canvasStore.activeCanvas`:** `StudioPage.vue` doesn't explicitly set `canvasStore.activeCanvas` — the canvas likely sets it internally. Check if `StudioCanvas.vue` sets `canvasStore.activeCanvas = this` on mount. If it does, we don't need the manual assignment above. If it doesn't, we must set it ourselves so that `ComponentProperties.vue` can read `canvasStore.activeCanvas.selectedBlocks`.

**Gotcha — `getFormDefinition` export:** Check if `dataPipeline.ts` exports `getFormDefinition`. It should — the function loads a form definition via `frappe.client.get`. If it doesn't exist, add it:

```typescript
// In dataPipeline.ts
export async function getFormDefinition(formName: string): Promise<FormDefinition> {
	return await call("frappe.client.get", {
		doctype: "NCE Form Definition",
		name: formName,
	})
}
```

**Gotcha — `getRootBlock` export:** Check if `serializer.ts` exports `getRootBlock`. If not, create a local helper:

```typescript
function createEmptyRootBlock(): Block {
	return getBlockInstance({
		componentName: "div",
		blockName: "body",
		originalElement: "body",
		baseStyles: {
			display: "flex",
			flexDirection: "column",
			width: "inherit",
			height: "100%",
		},
		children: [],
	})
}
```

---

### Step 2.5 — Update router

**File:** `frontend/src/router/studio_router.ts` — **EDIT**

Replace lines 37-42 (the existing NceFormDesigner route):

```typescript
  // NCE Form Designer Route (canvas-based)
  {
    path: "/form-designer/:formName",
    name: "NceFormDesigner",
    component: () => import("@nce/pages/NceFormDesignerCanvas.vue"),
    props: true,
  },
```

---

### Step 2.6 — Verify Stage 2

**Tests:**
1. Navigate to `/form-designer/NCE-FORM-00001` (use an existing form definition name)
2. The page loads with toolbar showing form title and target DocType badge
3. Left panel shows 3 groups: Fields, Layout, Actions
4. Drag `NceFormField` onto the canvas — preview block appears
5. Drag `NceCaption` — renders styled text preview
6. Drag `NceFormActionBar` — renders Save/Discard preview
7. Select a block — right panel shows `ComponentProperties` with props
8. Select an `NceFormField` block — right panel shows PathFinder button for `fieldPath` (because `ComponentProperties.vue` already has this built in)
9. Click PathFinder button, navigate and select a path — `fieldPath` prop updates, preview shows the path
10. Existing Studio pages at `/app/:appID/:pageID` still work normally
11. Existing form runtime at `/form/:formName/:docname` still works normally

**Stop here. Commit. Test. Then proceed to Stage 3.**

---

## Stage 3 — Save & Load (already mostly in Stage 2)

**Goal:** Save Layout persists the block tree to `form_schema`. Reloading the designer restores the layout.

**Note:** The save/load logic is already implemented in `NceFormDesignerCanvas.vue` (Step 2.4). This stage is about **testing the round-trip** and fixing any issues.

---

### Step 3.1 — Test the save round-trip

1. Open designer, add several components, bind some fields via PathFinder
2. Click "Save Layout"
3. Check the database: `frappe.get_doc("NCE Form Definition", "NCE-FORM-00001").form_schema` should contain the block tree JSON
4. Also check `field_mapping` was updated with the flat path mapping
5. Refresh the browser — the designer should reload with the saved layout intact
6. Verify all component props are preserved (field paths, labels, action types, etc.)

### Step 3.2 — Fix any serialization issues

If the block tree doesn't restore correctly, common issues:

- **`getBlockInstance` not handling NCE component props:** The `Block` constructor copies `initialState` from the registry, then the serialized `componentProps` should override those. Verify `getBlockInstance` in `serializer.ts` correctly merges saved `componentProps` over the defaults.
- **Missing `componentSlots`:** If `NceFormGrid` or `NceTabContainer` had `initialSlots: ["default"]` but the saved JSON doesn't include slot data, the restore may lose slot children. Check the serialization output.

**Stop here. Commit. Test. Then proceed to Stage 4.**

---

## Stage 4 — Runtime Block Tree Rendering

**Goal:** `NceFormRuntime` gains the ability to render forms from the block tree in `form_schema`, while keeping the existing `field_mapping` path working for old forms.

---

### Step 4.1 — Create the block tree renderer

**File:** `frontend/src/nce/components/runtime/BlockTreeRenderer.vue` — **NEW**

This component recursively walks a block tree JSON structure and renders each node as its corresponding Vue component. Unlike `StudioComponent.vue` (which works with live `Block` instances), this works with **plain JSON** (the parsed `form_schema`).

```vue
<template>
	<component
		v-if="node"
		:is="resolvedComponent"
		v-bind="node.componentProps || {}"
		:style="node.baseStyles || {}"
	>
		<!-- Render direct children -->
		<BlockTreeRenderer
			v-for="child in (node.children || [])"
			:key="child.componentId"
			:node="child"
		/>

		<!-- Render slot children -->
		<template
			v-for="(slot, slotName) in (node.componentSlots || {})"
			:key="slotName"
			v-slot:[slotName]
		>
			<template v-if="Array.isArray(slot.slotContent)">
				<BlockTreeRenderer
					v-for="slotChild in slot.slotContent"
					:key="slotChild.componentId"
					:node="slotChild"
				/>
			</template>
		</template>
	</component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue"

// Import the REAL NCE components (not the canvas previews)
import NceFormField from "@nce/components/FormElements/NceFormField.vue"
import NceFormGrid from "@nce/components/FormElements/NceFormGrid.vue"
import NceTabContainer from "@nce/components/FormElements/NceTabContainer.vue"
import NceFormActionBar from "@nce/components/FormElements/NceFormActionBar.vue"
import NceCaption from "@nce/components/FormElements/NceCaption.vue"
import NceActionButton from "@nce/components/FormElements/NceActionButton.vue"

interface BlockNode {
	componentId: string
	componentName: string
	componentProps?: Record<string, any>
	baseStyles?: Record<string, string>
	children?: BlockNode[]
	componentSlots?: Record<string, { slotName: string; slotContent: BlockNode[] | string }>
}

const props = defineProps<{
	node: BlockNode
}>()

// Map component names to real component imports.
// The global registry has preview versions; we need the real ones for runtime.
const NCE_RUNTIME_COMPONENTS: Record<string, any> = {
	NceFormField,
	NceFormGrid,
	NceTabContainer,
	NceFormActionBar,
	NceCaption,
	NceActionButton,
}

const resolvedComponent = computed(() => {
	const name = props.node.componentName
	// If it's an NCE component, use the real version (not the globally registered preview)
	if (NCE_RUNTIME_COMPONENTS[name]) {
		return NCE_RUNTIME_COMPONENTS[name]
	}
	// For standard HTML elements / Studio components, resolve via global registry
	return name
})
</script>
```

---

### Step 4.2 — Add block tree rendering mode to NceFormRuntime

**File:** `frontend/src/nce/pages/NceFormRuntime.vue` — **EDIT**

Add import at the top (after line 76):

```typescript
import BlockTreeRenderer from "@nce/components/runtime/BlockTreeRenderer.vue"
```

Add these computeds (after `formGridConfig` computed, around line 101):

```typescript
// Check if form_schema contains a block tree (has componentId)
const hasBlockTree = computed(() => {
	const def = nceFormStore.formDefinition
	if (!def?.form_schema) return false
	let schema = def.form_schema
	if (typeof schema === "string") {
		try { schema = JSON.parse(schema) } catch { return false }
	}
	return !!schema?.componentId
})

// Parse the block tree for rendering
const blockTree = computed(() => {
	if (!hasBlockTree.value) return null
	const def = nceFormStore.formDefinition
	let schema = def!.form_schema
	if (typeof schema === "string") schema = JSON.parse(schema)
	return schema
})
```

In the template, wrap the existing form body in a conditional and add the block tree path. Replace lines 31-56 (the `<template v-else>` section containing tabs/grid) with:

```vue
				<template v-else>
					<!-- Block tree mode (new canvas-designed forms) -->
					<template v-if="hasBlockTree && blockTree">
						<BlockTreeRenderer :node="blockTree" />
					</template>

					<!-- Legacy field_mapping mode (old forms) -->
					<template v-else>
						<!-- Tabbed layout -->
						<NceTabContainer
							v-if="hasTabs"
							:tabs="tabs"
						>
							<template
								v-for="(tab, idx) in visibleTabs"
								:key="idx"
								#[`tab-${idx}`]="slotProps"
							>
								<NceFormGrid
									:fields="slotProps.tab.fields"
									:gridConfig="formGridConfig"
								/>
							</template>
						</NceTabContainer>

						<!-- Flat layout -->
						<NceFormGrid
							v-else
							:fields="allFieldPaths"
							:gridConfig="formGridConfig"
						/>
					</template>
				</template>
```

---

### Step 4.3 — Verify Stage 4

**Tests:**
1. Open a form that was designed with the new canvas designer (has block tree in `form_schema`)
2. Navigate to `/form/NCE-FORM-00001/SOME-DOC-NAME`
3. Form renders from the block tree — each `NceFormField` shows live data from the record
4. Edit a field value, click Save — data persists to Frappe
5. Open an OLD form (one that only has `field_mapping`, no block tree) — renders using legacy tabs/grid mode
6. Both modes work simultaneously

**Stop here. Commit. Test. Then proceed to Stage 5.**

---

## Stage 5 — Preview Flow & Polish

**Goal:** Wire up the Preview button, add "Edit Layout" to runtime, and clean up.

---

### Step 5.1 — Improve Preview with sample record

The `openPreview` function in `NceFormDesignerCanvas.vue` already saves then navigates. Enhance it to find a sample record:

**File:** `frontend/src/nce/pages/NceFormDesignerCanvas.vue` — **EDIT**

Replace the `openPreview` function:

```typescript
import { getRandomDocName } from "@nce/utils/dataPipeline"

async function openPreview() {
	await saveLayout()
	const doctype = formDefinition.value?.target_doctype
	let docname: string | null = null
	if (doctype) {
		try {
			docname = await getRandomDocName(doctype)
		} catch {
			// No records found, navigate without docname
		}
	}
	if (docname) {
		router.push({ name: "NceFormRuntime", params: { formName: formName.value, docname } })
	} else {
		router.push({ name: "NceFormRuntime", params: { formName: formName.value } })
		toast.info("No records found — select a record manually in the form")
	}
}
```

**Gotcha:** Check if `getRandomDocName` is exported from `dataPipeline.ts`. It should be — it calls `studio.api.nce_api.get_random_doc_name`. If it's not exported, add it.

---

### Step 5.2 — Add "Edit Layout" button to NceFormRuntime

**File:** `frontend/src/nce/pages/NceFormRuntime.vue` — **EDIT**

In the template, add a button in the header area (inside the `<template v-else>` block, before the main content div). Or better — add it inside `NceFormHeader` if that component exists and has a slot/prop for extra actions.

Simplest approach — add a floating button:

After the `<NceFormHeader>` tag (line 16), add:

```vue
			<!-- Edit Layout button (System Manager only) -->
			<div class="flex justify-end bg-white px-4 pb-2">
				<Button
					variant="ghost"
					size="sm"
					@click="$router.push({ name: 'NceFormDesigner', params: { formName } })"
				>
					<template #prefix>
						<FeatherIcon name="edit-3" class="h-3 w-3" />
					</template>
					Edit Layout
				</Button>
			</div>
```

Add `Button` to the frappe-ui import on line 67:

```typescript
import { FeatherIcon, Button } from "frappe-ui"
```

---

### Step 5.3 — Verify Stage 5

**Full round-trip test:**
1. Create or open an NCE Form Definition (e.g. target DocType = "Customer")
2. Navigate to `/form-designer/NCE-FORM-00001`
3. Drag a `NceCaption` ("Customer Details"), two `NceFormField` blocks, and an `NceFormActionBar`
4. Use PathFinder to bind fields: `customer_name`, `customer_group`
5. Click "Save Layout" → verify toast "Layout saved"
6. Click "Preview" → runtime loads, shows live Customer data
7. Edit `customer_name` in the form, click Save → verify data persists
8. Click "Edit Layout" → back in designer with layout intact
9. Open an old legacy form → still renders via `field_mapping`
10. Open a normal Studio page → Studio builder works unchanged

**Stop here. Commit. Test.**

---

## Stage 6 — Cleanup (optional, defer if needed)

**Goal:** Remove the old simple designer code. Only do this when fully confident the new designer covers all use cases.

### Files to delete

```
frontend/src/nce/pages/NceFormDesigner.vue
frontend/src/nce/stores/nceFormDesignerStore.ts
frontend/src/nce/components/designer/DesignerCanvas.vue
frontend/src/nce/components/designer/DesignerFieldProperties.vue
frontend/src/nce/components/PathFinder/PathFinderPanelDesigner.vue
```

### Store barrel cleanup

**File:** `frontend/src/nce/stores/index.ts` — **EDIT**

Remove the line:
```typescript
export { useNceFormDesignerStore } from "./nceFormDesignerStore";
```

---

## Known Gotchas Checklist

The implementing agent should verify each of these:

| # | Gotcha | Where to check | Fix if needed |
|---|--------|----------------|---------------|
| 1 | `canvasStore.activeCanvas` must be set for ComponentProperties to work | Check if StudioCanvas sets it on mount, or if designer page must set it manually | Add `canvasStore.activeCanvas = pageCanvas.value` in `onMounted` |
| 2 | `getRootBlock` may not be exported from `serializer.ts` | Read `serializer.ts` exports | Use local helper or add export |
| 3 | `getFormDefinition` may not be exported from `dataPipeline.ts` | Read `dataPipeline.ts` exports | Add export if missing |
| 4 | `getRandomDocName` may not be exported from `dataPipeline.ts` | Read `dataPipeline.ts` exports | Add export if missing |
| 5 | `getBlockCopyWithoutParent` may not be exported from `serializer.ts` | Read `serializer.ts` exports | Add export if missing |
| 6 | `NceFormGrid` with `initialSlots: ["default"]` may cause issues if slot system expects specific block types | Test by dragging NceFormField INTO a NceFormGrid on canvas | May need to remove `initialSlots` and use `children` instead |
| 7 | Lucide icons may need exact import names | Check `lucide-vue-next` package for available icon names | Substitute if `LucideFormInput` etc. don't exist: use `FormInput`, `LayoutGrid`, `Columns3`, `Save`, `Type`, `MousePointerClick` |
| 8 | `nceFormStore.loadForm()` in designer context won't load a record — `targetDoctype` getter must still work | Read `nceFormStore.ts` to check if `targetDoctype` is derived from `formDefinition` | It should be: `computed(() => formDefinition?.target_doctype)` |
| 9 | CSS layout of designer page needs to handle canvas scaling/panning correctly | Studio pages use absolute positioning with dynamic left/right offsets | The designer uses flex layout instead — simpler but verify no overflow |

---

## File Index

### New Files (9)

| Path | Stage |
|------|-------|
| `frontend/src/nce/data/nceComponents.ts` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceFormFieldPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceFormGridPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceTabContainerPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceFormActionBarPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceCaptionPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/NceActionButtonPreview.vue` | 1 |
| `frontend/src/nce/components/FormElements/previews/index.ts` | 1 |
| `frontend/src/nce/components/designer/NceDesignerToolbar.vue` | 2 |
| `frontend/src/nce/components/designer/NceDesignerLeftPanel.vue` | 2 |
| `frontend/src/nce/components/designer/NceDesignerRightPanel.vue` | 2 |
| `frontend/src/nce/pages/NceFormDesignerCanvas.vue` | 2 |
| `frontend/src/nce/components/runtime/BlockTreeRenderer.vue` | 4 |

### Edited Files (4)

| Path | Stage | What changes |
|------|-------|-------------|
| `frontend/src/globals.ts` | 1 | Add 6 NCE preview component imports + registrations |
| `frontend/src/main.ts` | 1 | Import NCE_COMPONENTS, merge into Block.setComponents |
| `frontend/src/router/studio_router.ts` | 2 | Point form-designer route to NceFormDesignerCanvas |
| `frontend/src/nce/pages/NceFormRuntime.vue` | 4+5 | Add BlockTreeRenderer import, hasBlockTree/blockTree computeds, dual-mode template, Edit Layout button |

### Files to Delete (Stage 6)

| Path |
|------|
| `frontend/src/nce/pages/NceFormDesigner.vue` |
| `frontend/src/nce/stores/nceFormDesignerStore.ts` |
| `frontend/src/nce/components/designer/DesignerCanvas.vue` |
| `frontend/src/nce/components/designer/DesignerFieldProperties.vue` |
| `frontend/src/nce/components/PathFinder/PathFinderPanelDesigner.vue` |
