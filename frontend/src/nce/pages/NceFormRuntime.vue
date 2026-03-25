<template>
	<div class="nce-form-runtime flex min-h-screen flex-col bg-gray-50">
		<!-- Loading state -->
		<div
			v-if="nceFormStore.isLoading || !isSchemaLoaded"
			class="flex flex-1 items-center justify-center"
		>
			<div class="flex flex-col items-center gap-3">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
				<span class="text-sm text-gray-400">Loading form…</span>
			</div>
		</div>

		<template v-else>
			<!-- Header: form title, record selector, lock status -->
			<NceFormHeader class="bg-white shadow-sm" />

			<!-- Main content area -->
			<div class="flex-1 overflow-auto p-6">
				<!-- No record selected prompt -->
				<div
					v-if="!nceFormStore.currentDocname"
					class="flex flex-col items-center justify-center gap-4 py-20 text-gray-400"
				>
					<FeatherIcon name="file-text" class="h-16 w-16 text-gray-300" />
					<p class="text-lg font-medium">Select a record above to begin editing</p>
					<p class="max-w-md text-center text-sm text-gray-500">
						Use the record selector in the header to load an existing record or create a new one.
					</p>
				</div>

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
			</div>

			<!-- Action bar: Save / Submit / Discard -->
			<NceFormActionBar :submissionAction="nceFormStore.formDefinition?.submission_action || 'Save'" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { FeatherIcon } from "frappe-ui"
import { useRoute, useRouter } from "vue-router"
import { useNceFormStore } from "@nce/stores"
import { useFormSchema } from "@nce/composables/useFormSchema"
import { filterVisibleTabs, getFormFields } from "@nce/utils/schemaHelpers"
import { toast } from "vue-sonner"
import NceFormHeader from "@nce/components/FormElements/NceFormHeader.vue"
import NceTabContainer from "@nce/components/FormElements/NceTabContainer.vue"
import NceFormGrid from "@nce/components/FormElements/NceFormGrid.vue"
import NceFormActionBar from "@nce/components/FormElements/NceFormActionBar.vue"

const route = useRoute()
const router = useRouter()

const nceFormStore = useNceFormStore()
const { tabs, hasTabs, isLoaded: isSchemaLoaded, load: loadSchema } = useFormSchema()

// Form name from route
const formName = computed(() => route.params.formName as string)

// Record name from route (optional)
const docname = computed(() => route.params.docname as string | undefined)

// All field paths from form definition (delegates to schemaHelpers)
const allFieldPaths = computed(() => {
	const def = nceFormStore.formDefinition
	if (!def) return []
	return getFormFields(def)
})

// Grid config from form definition
const formGridConfig = computed(() => {
	const def = nceFormStore.formDefinition
	return def?.grid_config || {}
})

// Filter visible tabs based on conditions
const visibleTabs = computed(() => {
	return filterVisibleTabs(tabs.value || [], nceFormStore.getFormData())
})

// Lock refresh timer
const lockTimer = ref<ReturnType<typeof setInterval> | null>(null)

// Lifecycle: mount
onMounted(async () => {
	// Load the form definition
	await loadSchema(formName.value)
	await nceFormStore.loadForm(formName.value)

	// If docname provided, load it and acquire lock
	if (docname.value) {
		try {
			await nceFormStore.loadRecord(docname.value)
			await nceFormStore.acquireLock()
		} catch (err: any) {
			toast.error(err?.message || "Failed to load record")
		}
	}

	// Start lock auto-refresh AFTER loading completes (avoids race condition)
	lockTimer.value = setInterval(async () => {
		if (nceFormStore.editLock.locked) {
			try {
				await nceFormStore.refreshLock()
			} catch {
				// Auto-refresh failed — let the user manually re-acquire
			}
		}
	}, 5 * 60 * 1000)
})

// Lifecycle: unmount — release lock, stop timer, and clear form state
onUnmounted(() => {
	if (lockTimer.value) {
		clearInterval(lockTimer.value)
		lockTimer.value = null
	}
	nceFormStore.releaseLock()
	// Clear form state to prevent stale data on re-navigation
	nceFormStore.currentDocname = null
	nceFormStore.resolvedData = {}
	nceFormStore.dirtyFields = {}
	nceFormStore.validationErrors = {}
})

// Watch route changes (in case user navigates within same page)
watch(
	() => route.params,
	async (newParams) => {
		if (newParams.formName && newParams.formName !== formName.value) {
			// Form name changed — reload
			await loadSchema(newParams.formName as string)
			await nceFormStore.loadForm(newParams.formName as string)

			if (newParams.docname) {
				await nceFormStore.loadRecord(newParams.docname as string)
				await nceFormStore.acquireLock()
			}
		}
	}
)
</script>

<style scoped>
.nce-form-runtime {
	font-family: system-ui, -apple-system, sans-serif;
}
</style>
