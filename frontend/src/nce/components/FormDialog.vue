<template>
	<Dialog
		v-model="showDialog"
		:options="{
			title: isEditing ? 'Edit Form' : 'New Form',
			width: 'md',
		}"
		@after-leave="
			() => {
				activeForm = { ...emptyFormState }
				error = ''
			}
		"
	>
		<template #body-content>
			<div class="flex flex-col gap-3">
				<FormControl
					label="Form Title"
					type="text"
					variant="outline"
					v-model="activeForm.form_title"
					:required="true"
					placeholder="e.g. Player Registration"
				/>
				<div>
					<label class="mb-1.5 block text-xs text-gray-600">Target DocType</label>
					<Autocomplete
						:options="doctypeOptions"
						:modelValue="activeForm.target_doctype"
						@update:modelValue="(val: any) => activeForm.target_doctype = val?.value || val"
						placeholder="Select a DocType…"
					/>
				</div>
				<FormControl
					label="Submission Action"
					type="select"
					variant="outline"
					v-model="activeForm.submission_action"
					:options="[
						{ label: 'Save', value: 'Save' },
						{ label: 'Submit', value: 'Submit' },
						{ label: 'Workflow', value: 'Workflow' },
						{ label: 'Custom API', value: 'Custom API' },
					]"
				/>
				<FormControl
					v-if="activeForm.submission_action === 'Custom API'"
					label="Custom API Endpoint"
					type="text"
					variant="outline"
					v-model="activeForm.custom_api_endpoint"
					placeholder="myapp.api.submit_form"
				/>
			</div>
		</template>

		<template #actions>
			<div class="space-y-1">
				<ErrorMessage class="mb-2" :message="error" />
				<Button
					variant="solid"
					:label="isEditing ? 'Update' : 'Create'"
					@click="handleSave"
					class="w-full"
				/>
			</div>
		</template>
	</Dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue"
import { useRouter } from "vue-router"
import { studioForms } from "@/data/studioForms"
import { Dialog, FormControl, Autocomplete, createResource } from "frappe-ui"
import { toast } from "vue-sonner"

interface FormDef {
	name: string
	form_title: string
	target_doctype: string
	submission_action: string
	custom_api_endpoint: string
}

const props = defineProps<{ form?: FormDef | null }>()
const showDialog = defineModel("showDialog", { type: Boolean, required: true })

const emptyFormState: FormDef = {
	name: "",
	form_title: "",
	target_doctype: "",
	submission_action: "Save",
	custom_api_endpoint: "",
}

const activeForm = ref<FormDef>({ ...emptyFormState })
const error = ref("")
const router = useRouter()
const doctypeOptions = ref<{ label: string; value: string }[]>([])

const isEditing = computed(() => !!props.form?.name)

watch(
	() => showDialog.value,
	() => {
		if (props.form?.name) {
			activeForm.value = {
				name: props.form.name,
				form_title: props.form.form_title,
				target_doctype: props.form.target_doctype,
				submission_action: props.form.submission_action || "Save",
				custom_api_endpoint: props.form.custom_api_endpoint || "",
			}
		} else {
			activeForm.value = { ...emptyFormState }
		}
	},
	{ immediate: true },
)

// Fetch available DocTypes for the autocomplete
const doctypeList = createResource({
	url: "frappe.client.get_list",
	params: {
		doctype: "DocType",
		filters: { istable: 0, issingle: 0 },
		fields: ["name"],
		order_by: "name asc",
		limit_page_length: 0,
	},
	auto: true,
	onSuccess(data: { name: string }[]) {
		doctypeOptions.value = data.map((d) => ({
			label: d.name,
			value: d.name,
		}))
	},
})

function handleSave() {
	if (!activeForm.value.form_title?.trim()) {
		error.value = "Form Title is required"
		return
	}
	if (!activeForm.value.target_doctype?.trim()) {
		error.value = "Target DocType is required"
		return
	}
	error.value = ""

	if (isEditing.value) {
		updateForm()
	} else {
		createForm()
	}
}

function createForm() {
	studioForms.insert.submit(
		{
			form_title: activeForm.value.form_title,
			target_doctype: activeForm.value.target_doctype,
			submission_action: activeForm.value.submission_action,
			custom_api_endpoint: activeForm.value.custom_api_endpoint || undefined,
		},
		{
			onSuccess(res: any) {
				showDialog.value = false
				error.value = ""
				toast.success(`Form "${activeForm.value.form_title}" created`)
				// Navigate to the form editor
				router.push({ name: "NceFormRuntime", params: { formName: res.name } })
			},
			onError(err: any) {
				error.value = err.messages?.join(", ") || "Failed to create form"
			},
		},
	)
}

const emit = defineEmits(["update"])

function updateForm() {
	studioForms.setValue.submit(
		{
			name: activeForm.value.name,
			form_title: activeForm.value.form_title,
			target_doctype: activeForm.value.target_doctype,
			submission_action: activeForm.value.submission_action,
			custom_api_endpoint: activeForm.value.custom_api_endpoint || "",
		},
		{
			onSuccess(data: any) {
				showDialog.value = false
				error.value = ""
				toast.success(`Form "${activeForm.value.form_title}" updated`)
				emit("update", data)
			},
			onError(err: any) {
				error.value = err.messages?.join(", ") || "Failed to update form"
			},
		},
	)
}
</script>
