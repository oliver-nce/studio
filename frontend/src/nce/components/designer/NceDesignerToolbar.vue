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
