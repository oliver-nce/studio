import { ref, computed, type Ref } from "vue";
import { call } from "frappe-ui";
import type { FormDefinition, TabDefinition, FieldMeta } from "@nce/types";

export interface UseFormSchemaReturn {
	schema: Ref<FormDefinition | null>;
	fields: Ref<FieldMeta[]>;
	tabs: Ref<TabDefinition[]>;
	hasTabs: Ref<boolean>;
	targetDoctype: Ref<string>;
	isLoaded: Ref<boolean>;
	load: (formName: string) => Promise<void>;
}

export function useFormSchema(): UseFormSchemaReturn {
	const schema = ref<FormDefinition | null>(null);
	const fields = ref<FieldMeta[]>([]);
	const tabs = ref<TabDefinition[]>([]);
	const isLoaded = ref(false);

	const hasTabs = computed(() => tabs.value.length > 0);
	const targetDoctype = computed(() => schema.value?.target_doctype ?? "");

	async function load(formName: string): Promise<void> {
		isLoaded.value = false;
		try {
			const result = await call("frappe.client.get", {
				doctype: "NCE Form Definition",
				name: formName,
			});

			schema.value = result as FormDefinition;
			fields.value = [];
			tabs.value = schema.value.tab_layout ?? [];

			// Fetch field metadata from the target DocType using standard Frappe meta API
			if (schema.value.target_doctype) {
				const metaResult = await call("frappe.client.get", {
					doctype: "DocType",
					name: schema.value.target_doctype,
				});
				if (metaResult && metaResult.fields) {
					fields.value = metaResult.fields as FieldMeta[];
				}
			}

			isLoaded.value = true;
		} catch (err) {
			console.error("Failed to load form schema:", err);
			isLoaded.value = false;
		}
	}

	return {
		schema,
		fields,
		tabs,
		hasTabs,
		targetDoctype,
		isLoaded,
		load,
	};
}
