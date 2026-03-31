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
				doctypeQuery.value = ''
				_panelOpen.value = false
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
				<div class="relative">
					<label class="mb-1.5 block text-xs text-gray-600">Target DocType</label>
					<div class="relative">
						<input
							type="text"
							class="h-9 w-full rounded-md border border-gray-300 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder="Select a DocType…"
							:value="targetDoctypeDisplay"
							@click="togglePanel"
							@focus="loadDoctypesIfEmpty"
						/>
						<button
							v-if="doctypeOptions.length > 0"
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
							@click.stop="togglePanel"
						>
							<FeatherIcon name="chevron-down" class="h-4 w-4" />
						</button>
					</div>

					<!-- DocType Picker Panel -->
					<div
						ref="panelRef"
						v-if="_panelOpen && doctypeOptions.length > 0"
						class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
					>
						<div class="border-b border-gray-200 p-2">
							<input
								type="text"
								v-model="doctypeQuery"
								class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Filter DocTypes…"
								@keydown.esc="closePanel"
								@keydown.down="focusFirstOption"
								@keydown.enter="selectFirstOption"
							/>
						</div>
						<ul class="divide-y divide-gray-100">
							<li
								v-for="opt in filteredDoctypeOptions"
								:key="opt.value"
								class="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
								@click="selectDocType(opt)"
							>
								{{ opt.label }}
							</li>
						</ul>
						<div v-if="filteredDoctypeOptions.length === 0" class="px-3 py-2 text-sm text-gray-500">
							No DocTypes found
						</div>
					</div>
				</div>

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
import { computed, ref, watch, nextTick } from "vue"
import { useRouter } from "vue-router"
import { studioForms } from "@/data/studioForms"
import { Dialog, FormControl, call, FeatherIcon } from "frappe-ui"
import { onClickOutside } from "@vueuse/core"
import { toast } from "vue-sonner"

interface FormDef {
	name: string
	form_title: string
	target_doctype: string
}

const props = defineProps<{ form?: FormDef | null }>()
const showDialog = defineModel("showDialog", { type: Boolean, required: true })

const emptyFormState: FormDef = {
	name: "",
	form_title: "",
	target_doctype: "",
}

const activeForm = ref<FormDef>({ ...emptyFormState })
const error = ref("")
const router = useRouter()
const doctypeOptions = ref<{ label: string; value: string }[]>([])
const _panelOpen = ref(false)
const doctypeQuery = ref("")

const isEditing = computed(() => !!props.form?.name)

watch(
	() => showDialog.value,
	() => {
		if (props.form?.name) {
			activeForm.value = {
				name: props.form.name,
				form_title: props.form.form_title,
				target_doctype: props.form.target_doctype,
			}
		} else {
			activeForm.value = { ...emptyFormState }
		}
	},
	{ immediate: true },
)

const loadDoctypesIfEmpty = async () => {
	if (doctypeOptions.value.length === 0 && !_panelOpen.value) {
		await loadDoctypes()
	}
}

const loadDoctypes = async () => {
	try {
		const result = await call("frappe.client.get_list", {
			doctype: "DocType",
			filters: { istable: 0, issingle: 0 },
			fields: ["name"],
			order_by: "name asc",
			limit_page_length: 0,
		})
		if (Array.isArray(result)) {
			doctypeOptions.value = result.map((d: any) => ({
				label: d.name,
				value: d.name,
			}))
		}
	} catch (err: any) {
		toast.error(err.message || "Failed to load DocTypes")
		doctypeOptions.value = []
	}
}

const targetDoctypeDisplay = computed(() => {
	const selected = doctypeOptions.value.find((d) => d.value === activeForm.value.target_doctype)
	return selected ? selected.label : activeForm.value.target_doctype || "Select a DocType…"
})

const filteredDoctypeOptions = computed(() => {
	const query = doctypeQuery.value.toLowerCase()
	return doctypeOptions.value.filter(
		(d) =>
			d.label.toLowerCase().includes(query) || d.value.toLowerCase().includes(query),
	).slice(0, 200)
})

const panelRef = ref<HTMLElement | null>(null)

watch(_panelOpen, (open) => {
	if (open) {
		nextTick(() => {
			if (panelRef.value) {
				onClickOutside(panelRef.value, () => closePanel())
			}
		})
	}
})

function closePanel() {
	_panelOpen.value = false
	doctypeQuery.value = ""
}

function togglePanel() {
	if (_panelOpen.value) {
		closePanel()
	} else {
		_panelOpen.value = true
		nextTick(() => loadDoctypesIfEmpty())
	}
}

function selectDocType(opt: { label: string; value: string }) {
	activeForm.value.target_doctype = opt.value
	closePanel()
}

function selectFirstOption() {
	if (filteredDoctypeOptions.value.length > 0) {
		selectDocType(filteredDoctypeOptions.value[0])
	}
}

function focusFirstOption() {
	// For keyboard navigation
}

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
		},
		{
			onSuccess(res: any) {
				showDialog.value = false
				error.value = ""
				toast.success(`Form "${activeForm.value.form_title}" created`)
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
