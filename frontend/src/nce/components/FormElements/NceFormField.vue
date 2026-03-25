<template>
	<div class="nce-form-field flex flex-col gap-1">
		<label v-if="displayLabel" class="text-xs font-medium text-gray-700">
			{{ displayLabel }}
			<span v-if="isRequired" class="text-red-500">*</span>
		</label>

		<span v-if="!editable" class="text-sm text-gray-800">
			{{ formattedValue ?? '—' }}
		</span>

		<template v-else>
			<Checkbox
				v-if="resolvedFieldType === 'Check'"
				:modelValue="!!currentValue"
				@update:modelValue="handleChange"
				:label="displayLabel"
			/>

			<Select
				v-else-if="resolvedFieldType === 'Select'"
				:modelValue="currentValue"
				@update:modelValue="handleChange"
				:options="selectOptions"
				:placeholder="placeholder || `Select ${displayLabel}`"
			/>

			<Autocomplete
				v-else-if="resolvedFieldType === 'Link'"
				:modelValue="currentValue"
				@update:modelValue="handleLinkChange"
				:options="linkOptions"
				:placeholder="placeholder || `Search ${fieldOptions}…`"
			/>

			<DatePicker
				v-else-if="resolvedFieldType === 'Date'"
				:modelValue="currentValue"
				@update:modelValue="handleChange"
				:placeholder="placeholder || 'Select date'"
			/>

			<DateTimePicker
				v-else-if="resolvedFieldType === 'Datetime'"
				:modelValue="currentValue"
				@update:modelValue="handleChange"
				:placeholder="placeholder || 'Select date & time'"
			/>

			<Textarea
				v-else-if="isTextType"
				:modelValue="currentValue ?? ''"
				@update:modelValue="handleChange"
				:placeholder="placeholder"
				rows="3"
			/>

			<TextInput
				v-else-if="isNumericType"
				type="number"
				:modelValue="currentValue"
				@update:modelValue="handleChange"
				:placeholder="placeholder"
			/>

			<TextInput
				v-else
				:modelValue="currentValue ?? ''"
				@update:modelValue="handleChange"
				:placeholder="placeholder"
			/>
		</template>

		<p v-if="validationError" class="text-xs text-red-500">
			{{ validationError }}
		</p>

		<p v-if="fieldDescription" class="text-xs text-gray-400">
			{{ fieldDescription }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue"
import {
	Autocomplete,
	Checkbox,
	DatePicker,
	DateTimePicker,
	Select,
	Textarea,
	TextInput,
} from "frappe-ui"
import { call } from "frappe-ui"
import { useNceFormStore } from "@nce/stores"

const props = withDefaults(
	defineProps<{
		fieldPath: string
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

const nceFormStore = useNceFormStore()

// Field metadata resolved from the form's target DocType
const fieldMeta = ref<Record<string, any>>({})

const resolvedFieldType = computed(() => {
	return props.fieldType || fieldMeta.value?.fieldtype || "Data"
})

const displayLabel = computed(() => {
	return props.label || fieldMeta.value?.label || props.fieldPath
})

const fieldOptions = computed(() => {
	return fieldMeta.value?.options || ""
})

const fieldDescription = computed(() => {
	return fieldMeta.value?.description || ""
})

const isRequired = computed(() => {
	return props.required || fieldMeta.value?.reqd
})

const isTextType = computed(() => {
	return ["Text", "Small Text", "Long Text", "Text Editor"].includes(resolvedFieldType.value)
})

const isNumericType = computed(() => {
	return ["Int", "Float", "Currency", "Percent"].includes(resolvedFieldType.value)
})

// Current field value — dirty override wins over resolved
const currentValue = computed(() => {
	return nceFormStore.getFieldValue(props.fieldPath)
})

// Formatted read-only display
const formattedValue = computed(() => {
	const val = currentValue.value
	if (val === null || val === undefined) return null
	if (resolvedFieldType.value === "Check") return val ? "Yes" : "No"
	return String(val)
})

// Validation error from the form store
const validationError = computed(() => {
	return nceFormStore.validationErrors[props.fieldPath] || ""
})

// Select field options parsed from meta
const selectOptions = computed(() => {
	const opts = fieldOptions.value
	if (!opts) return []
	return opts
		.split("\n")
		.filter(Boolean)
		.map((o: string) => ({ label: o, value: o }))
})

// Link field options fetched via server search
const linkOptions = ref<Array<{ label: string; value: string }>>([])

async function fetchLinkOptions() {
	if (resolvedFieldType.value !== "Link" || !fieldOptions.value) return
	try {
		const result = await call("frappe.client.get_list", {
			doctype: fieldOptions.value,
			fields: ["name"],
			limit_page_length: 20,
		})
		linkOptions.value = (result || []).map((r: { name: string }) => ({
			label: r.name,
			value: r.name,
		}))
	} catch {
		linkOptions.value = []
	}
}

function handleChange(value: any) {
	nceFormStore.setFieldValue(props.fieldPath, value)
}

function handleLinkChange(option: any) {
	const value = typeof option === "string" ? option : option?.value || ""
	nceFormStore.setFieldValue(props.fieldPath, value)
}

// Guard against state updates on unmounted component
let isMounted = true
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedResolveFieldMeta() {
	if (debounceTimer) clearTimeout(debounceTimer)
	debounceTimer = setTimeout(resolveFieldMeta, 150)
}

// Resolve field metadata from the target DocType on mount.
// For nested paths (e.g. "customer.customer_group.name"), traverses through
// linked doctypes to find metadata for the terminal field.
async function resolveFieldMeta() {
	if (!isMounted) return
	if (!nceFormStore.targetDoctype || !props.fieldPath) return

	const segments = props.fieldPath.split(".")

	try {
		if (segments.length === 1) {
			// Simple path — look up in root doctype
			const result = await call("studio.api.get_doctype_fields", {
				doctype: nceFormStore.targetDoctype,
			})
			if (!isMounted) return
			const field = (result || []).find((f: any) => f.fieldname === segments[0])
			if (field) fieldMeta.value = field
		} else {
			// Nested path — traverse link chain to find the correct doctype
			let currentDoctype = nceFormStore.targetDoctype

			for (let i = 0; i < segments.length; i++) {
				const result = await call("studio.api.get_doctype_fields", {
					doctype: currentDoctype,
				})
				if (!isMounted) return

				const field = (result || []).find((f: any) => f.fieldname === segments[i])

				if (!field) break

				if (i === segments.length - 1) {
					// Terminal segment — this is the field we want
					fieldMeta.value = field
				} else if (field.fieldtype === "Link" && field.options) {
					// Intermediate Link field — follow to the linked doctype
					currentDoctype = field.options
				} else {
					// Non-link intermediate — can't traverse further
					break
				}
			}
		}
	} catch {
		// Silently fail — will use prop defaults
	}

	// Pre-fetch link options if this is a Link field
	if (isMounted && resolvedFieldType.value === "Link") {
		await fetchLinkOptions()
	}
}

onMounted(resolveFieldMeta)
onUnmounted(() => {
	isMounted = false
	if (debounceTimer) clearTimeout(debounceTimer)
})
watch(() => props.fieldPath, debouncedResolveFieldMeta)
watch(() => nceFormStore.targetDoctype, debouncedResolveFieldMeta)
</script>
