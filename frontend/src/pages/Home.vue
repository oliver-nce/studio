<template>
	<div class="isolate h-screen flex-col overflow-hidden bg-white">
		<div
			class="toolbar sticky top-0 z-10 flex h-14 items-center justify-between bg-white px-3 py-2 shadow-sm"
		>
			<Dropdown :options="[{ label: 'Logout', icon: 'log-out', onClick: () => session.logout() }]">
				<template v-slot="{ open }">
					<div class="flex cursor-pointer items-center gap-2">
						<StudioLogo class="h-7 w-7"></StudioLogo>
						<router-link class="flex items-center gap-2" :to="{ name: 'Home' }">
							<h1 class="text-md mt-[2px] font-semibold leading-5 text-gray-800">Studio</h1>
						</router-link>
						<FeatherIcon :name="open ? 'chevron-up' : 'chevron-down'" class="h-4 w-4 text-gray-700" />
					</div>
				</template>
			</Dropdown>

			<Button variant="solid" icon-left="plus" @click="showFormDialog = true">New Form</Button>
		</div>

		<div class="flex h-full flex-col items-center px-20 py-10">
			<div class="flex w-full flex-row justify-between">
				<div class="text-lg font-semibold text-gray-800">NCE Forms</div>
				<div class="relative flex">
					<Input
						class="w-48"
						type="text"
						variant="outline"
						placeholder="Search"
						v-model="searchFilter"
						autofocus
						@input="
							(value: string) => {
								searchFilter = value
							}
						"
					>
						<template #prefix>
							<FeatherIcon name="search" class="h-4 w-4 text-gray-500" />
						</template>
					</Input>
				</div>
			</div>

			<section class="mt-5 w-full">
				<div v-if="!studioForms.data?.length && !searchFilter" class="col-span-full">
					<p class="mt-4 text-base text-gray-500">
						You don't have any forms yet. Click the "+ New Form" button to create one.
					</p>
				</div>
				<div v-else-if="!studioForms.data?.length" class="col-span-full">
					<p class="mt-4 text-base text-gray-500">No matching forms found</p>
				</div>
				<div v-else class="grid w-full grid-cols-4 items-start gap-5">
					<router-link
						class="flex flex-col justify-center gap-1 rounded-lg border-2 p-4 transition-colors hover:border-gray-300"
						v-for="form in studioForms.data"
						:to="{ name: 'NceFormRuntime', params: { formName: form.name } }"
						:key="form.name"
					>
						<div class="group flex flex-row justify-between">
							<div class="font-semibold text-gray-800">{{ form.form_title }}</div>
							<div class="invisible shrink-0 group-hover:visible has-[[data-state=open]]:visible">
								<Dropdown
									:options="[
										{
											label: 'Edit',
											onClick: () => {
												activeForm = form
												showFormDialog = true
											},
											icon: 'edit',
										},
										{
											label: 'View in Desk',
											onClick: () => openFormInDesk(form),
											icon: 'arrow-up-right',
										},
										{
											label: 'Delete',
											onClick: () => deleteForm(form),
											icon: 'trash-2',
											theme: 'red',
										},
									]"
									:button="{
										icon: 'more-horizontal',
										label: 'Form Options',
										variant: 'ghost',
									}"
									size="sm"
									placement="right"
								/>
							</div>
						</div>
						<p class="mt-0.5 text-xs font-medium text-indigo-600">{{ form.target_doctype }}</p>
						<div class="mt-1 flex items-center gap-2">
							<UseTimeAgo v-slot="{ timeAgo }" :time="form.modified || form.creation">
								<span class="text-xs text-gray-400">{{ timeAgo }}</span>
							</UseTimeAgo>
						</div>
					</router-link>
				</div>
			</section>
		</div>

		<FormDialog
			v-model:showDialog="showFormDialog"
			:form="activeForm"
			@after-leave="() => (activeForm = null)"
			@update="() => fetchForms()"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { studioForms } from "@/data/studioForms"
import { UseTimeAgo } from "@vueuse/components"
import Input from "@/components/Input.vue"
import StudioLogo from "@/components/Icons/StudioLogo.vue"
import session from "@/utils/session"
import { watchDebounced } from "@vueuse/core"
import FormDialog from "@nce/components/FormDialog.vue"
import { toast } from "vue-sonner"

const searchFilter = ref("")

const fetchForms = () => {
	const filters = {} as any
	if (searchFilter.value) {
		filters["form_title"] = ["like", `%${searchFilter.value}%`]
	}
	studioForms.update({
		filters,
	})
	studioForms.fetch()
}

watchDebounced(searchFilter, fetchForms, { debounce: 300, immediate: true })

const showFormDialog = ref(false)
const activeForm = ref<any>(null)

function openFormInDesk(form: any) {
	window.open(`/app/nce-form-definition/${form.name}`, "_blank")
}

function deleteForm(form: any) {
	if (!confirm(`Delete form "${form.form_title}"?`)) return
	studioForms.delete.submit(form.name, {
		onSuccess() {
			toast.success(`Form "${form.form_title}" deleted`)
			fetchForms()
		},
		onError(err: any) {
			toast.error(err.messages?.join(", ") || "Failed to delete form")
		},
	})
}
</script>
