// NCE Studio — Form Schema Helpers
// Pure utility functions for parsing and transforming form definitions

import type { FormDefinition, TabDefinition, FieldMeta } from "@nce/types";

// ---------------------------------------------------------------------------
// mapFieldsToTabs
// Groups field paths into tab buckets based on the tab_layout definition.
// If no tabs defined, returns a single "_default" bucket.
// ---------------------------------------------------------------------------

export function mapFieldsToTabs(
	schema: FormDefinition,
	tabLayout: TabDefinition[] = [],
): Record<string, string[]> {
	if (!tabLayout || tabLayout.length === 0) {
		// No tabs defined — return all fields under a default bucket
		const allPaths = Object.values(schema.field_mapping ?? {}).filter(
			(v): v is string => typeof v === "string",
		);
		return { _default: allPaths };
	}

	const result: Record<string, string[]> = {};

	for (const tab of tabLayout) {
		// If tab has a condition, skip it if condition evaluates to false
		if (tab.condition && schema.form_schema) {
			try {
				const fn = new Function("data", `return !!(${tab.condition})`);
				if (!fn(schema.form_schema)) {
					continue;
				}
			} catch {
				// If condition evaluation fails, skip the tab (fail-safe)
				continue;
			}
		}

		// Use tab label as key
		const key = tab.label || "Unnamed Tab";
		result[key] = tab.fields ?? [];
	}

	return result;
}

// ---------------------------------------------------------------------------
// resolveFieldMapping
// Merges field mapping with DocType metadata to get full field info per path.
// ---------------------------------------------------------------------------

export function resolveFieldMapping(
	fieldMapping: Record<string, any>,
	docMeta: FieldMeta[],
): Record<string, FieldMeta> {
	const result: Record<string, FieldMeta> = {};

	// Build a lookup map from fieldname to FieldMeta
	const metaMap = new Map<string, FieldMeta>();
	for (const meta of docMeta) {
		metaMap.set(meta.fieldname, meta);
	}

	for (const [componentId, fieldPath] of Object.entries(fieldMapping)) {
		if (typeof fieldPath !== "string") continue;

		// Extract terminal fieldname from dot-notation path
		const segments = fieldPath.split(".");
		const fieldName = segments[segments.length - 1];

		// Try to find matching meta
		const meta = metaMap.get(fieldName);

		result[fieldPath] = meta || {
			fieldname: fieldName,
			fieldtype: "Data",
			label: fieldName,
		};
	}

	return result;
}

// ---------------------------------------------------------------------------
// evaluateCondition
// Evaluates a JavaScript condition string against form data.
// Returns true on any error (fail-safe).
// ---------------------------------------------------------------------------

export function evaluateCondition(
	condition: string,
	formData: Record<string, any>,
): boolean {
	if (!condition) return true;

	try {
		const fn = new Function("data", `return !!(${condition})`);
		return fn(formData) === true;
	} catch {
		// Fail-safe: show the element if condition cannot be evaluated
		return true;
	}
}

// ---------------------------------------------------------------------------
// getFieldComponent
// Returns the appropriate Frappe UI component name for a given field type.
// ---------------------------------------------------------------------------

export function getFieldComponent(fieldtype: string): string {
	const map: Record<string, string> = {
		// Text types
		Data: "TextInput",
		"Small Text": "TextInput",
		"Long Text": "Textarea",
		"Text Editor": "Textarea",
		"Markdown Editor": "Textarea",
		Code: "Textarea",
		"HTML Editor": "Textarea",

		// Numeric types
		Int: "TextInput",
		Float: "TextInput",
		Currency: "TextInput",
		Percent: "TextInput",
		Duration: "TextInput",
		Check: "Checkbox",

		// Selection types
		Select: "Select",

		// Link types
		Link: "Autocomplete",
		"Dynamic Link": "Autocomplete",

		// Date/Time types
		Date: "DatePicker",
		Datetime: "DateTimePicker",
		Time: "TimePicker",

		// Table types
		Table: "NcePortalList",
		"Table MultiSelect": "NcePortalList",

		// Other types
		Button: "Button",
		HTML: "HTML",
		Section: "Section",
		"Column Break": "Column Break",
		"Tab Break": "Tab Break",
		Heading: "Heading",
		Legend: "Heading",
		Empty: "Empty",
		Image: "ImageView",
		Attach: "FileUploader",
		AttachImage: "FileUploader",
		Password: "TextInput",
		"Read Only": "TextInput",
		Signature: "Textarea",
		Country: "Autocomplete",
		MultiSelect: "MultiSelect",
		Color: "ColorPicker",
	};

	// Handle custom fieldtypes by falling back to TextInput
	return map[fieldtype] || "TextInput";
}

// ---------------------------------------------------------------------------
// buildGridConfig
// Generates CSS Grid placement rules from layout config.
// ---------------------------------------------------------------------------

export interface GridPlacement {
	fieldPath: string;
	colSpan: number;
	rowSpan: number;
	colStart?: number;
	rowStart?: number;
}

export function buildGridConfig(
	fields: string[],
	gridLayout: Record<string, any> = {},
): GridPlacement[] {
	const placements: GridPlacement[] = [];

	let colIndex = 0;
	const totalColumns = 12; // Standard 12-column grid

	for (const fieldPath of fields) {
		const layoutConfig = gridLayout[fieldPath] || {};

		// Extract span values from config
		const colSpan = layoutConfig.colSpan || 1;
		const rowSpan = layoutConfig.rowSpan || 1;

		// Handle column wrapping (auto-increment when adding fields)
		if (colIndex + colSpan > totalColumns) {
			colIndex = 0;
		}

		placements.push({
			fieldPath,
			colSpan,
			rowSpan,
			colStart: colIndex + 1,
			rowStart: 1, // Simplified: all fields in first row initially
		});

		colIndex += colSpan;
	}

	return placements;
}

// ---------------------------------------------------------------------------
// getFormFields
// Extracts all field paths from a form definition, respecting tab_layout.
// ---------------------------------------------------------------------------

export function getFormFields(schema: FormDefinition): string[] {
	const allPaths = new Set<string>();

	// Start with field_mapping if present (canonical source)
	if (schema.field_mapping && typeof schema.field_mapping === "object") {
		for (const path of Object.values(schema.field_mapping)) {
			if (typeof path === "string") {
				allPaths.add(path);
			}
		}
	}

	// Fallback: form_schema keys
	if (
		!allPaths.size &&
		schema.form_schema &&
		typeof schema.form_schema === "object"
	) {
		for (const path of Object.keys(schema.form_schema)) {
			if (typeof path === "string") {
				allPaths.add(path);
			}
		}
	}

	// Fallback: form_schema values (if they're objects with name fields)
	if (
		!allPaths.size &&
		schema.form_schema &&
		typeof schema.form_schema === "object"
	) {
		for (const value of Object.values(schema.form_schema)) {
			if (
				value &&
				typeof value === "object" &&
				typeof value.name === "string"
			) {
				allPaths.add(value.name);
			}
		}
	}

	return Array.from(allPaths);
}
