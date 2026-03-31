<template>
	<div class="toolbar flex h-14 items-center justify-center bg-white p-2 shadow-sm">
		<!-- Left section: Back + mode selectors (mirrors StudioToolbar layout) -->
		<div class="absolute left-3 flex items-center justify-center gap-5">
			<Dropdown
				:options="[
					{
						group: 'Form Designer',
						hideLabel: true,
						items: [
							{
								label: 'Back to Dashboard',
								icon: 'arrow-left',
								onClick: () => $router.push({ name: 'Home' }),
							},
						],
					},
				]"
			>
				<template v-slot="{ open }">
					<div class="flex cursor-pointer items-center gap-1">
						<StudioLogo class="h-7 w-7"></StudioLogo>
						<FeatherIcon :name="open ? 'chevron-up' : 'chevron-down'" class="h-4 w-4 text-gray-700" />
					</div>
				</template>
			</Dropdown>
			<div class="flex gap-2">
				<Tooltip
					:text="mode.description"
					:hoverDelay="0.6"
					v-for="mode in [
						{ mode: 'select', icon: 'mouse-pointer', description: 'Select (v)' },
						{ mode: 'container', icon: 'square', description: 'Container (c)' },
					]"
				>
					<Button
						variant="ghost"
						:icon="mode.icon"
						class="text-ink-gray-7 hover:bg-surface-gray-2 focus:!bg-surface-gray-3 [&[active='true']]:bg-surface-gray-3 [&[active='true']]:text-ink-gray-9"
						@click="() => (store.mode = mode.mode as StudioMode)"
						:active="store.mode === mode.mode"
					/>
				</Tooltip>
			</div>
		</div>

		<!-- Center section: form title + doctype badge -->
		<div class="flex items-center gap-2 p-2">
			<span class="max-w-48 truncate text-base text-gray-800">
				{{ formDefinition?.form_title || "Form Designer" }}
			</span>
			<Badge v-if="formDefinition?.target_doctype" variant="subtle" size="sm" theme="gray">
				{{ formDefinition.target_doctype }}
			</Badge>
		</div>

		<!-- Right section: Preview + Save (mirrors StudioToolbar's right buttons) -->
		<div class="absolute right-3 flex items-center gap-2">
			<Button size="sm" variant="subtle" @click="$emit('preview')">
				Preview
			</Button>
			<Button
				size="sm"
				variant="solid"
				:loading="isSaving"
				@click="$emit('save')"
			>
				Save Layout
			</Button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Tooltip, Badge } from "frappe-ui"
import useStudioStore from "@/stores/studioStore"
import StudioLogo from "@/components/Icons/StudioLogo.vue"
import type { StudioMode } from "@/types"
import type { FormDefinition } from "@nce/types"

const store = useStudioStore()

defineProps<{
	formDefinition: FormDefinition | null
	isSaving: boolean
}>()

defineEmits<{
	save: []
	preview: []
}>()
</script>
