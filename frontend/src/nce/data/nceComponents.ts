import type { FrappeUIComponents } from "@/types"

import LucideFormInput from "~icons/lucide/form-input"
import LucideLayoutGrid from "~icons/lucide/layout-grid"
import LucideColumns3 from "~icons/lucide/columns-3"
import LucideSave from "~icons/lucide/save"
import LucideType from "~icons/lucide/type"
import LucideMousePointer2 from "~icons/lucide/mouse-pointer-2"

/**
 * NCE form component definitions for the Studio block system.
 * These are merged into the global COMPONENTS registry so that
 * Block.setComponents() can look up initialState when creating blocks.
 *
 * Icon imports use the ~icons/lucide/... format (unplugin-icons),
 * matching the pattern in src/data/components.ts.
 */
export const NCE_COMPONENTS: FrappeUIComponents = {
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
		// Allow child blocks to be dropped inside this container
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
		icon: LucideMousePointer2,
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
