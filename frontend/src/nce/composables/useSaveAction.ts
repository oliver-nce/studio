/**
 * Shared composable for save and submit actions.
 *
 * Encapsulates the lock-expiry guard, store save/submit calls, and toast
 * feedback so that NceFormActionBar and NceActionButton (and any future
 * save triggers) share identical behaviour.
 */

import { call } from "frappe-ui"
import { toast } from "vue-sonner"
import { useNceFormStore } from "@nce/stores"

export function useSaveAction() {
	const nceFormStore = useNceFormStore()

	/**
	 * Check whether the current edit lock has expired.
	 * Returns true if expired (caller should abort), false if OK to proceed.
	 */
	function isLockExpired(): boolean {
		if (nceFormStore.editLock.locked && nceFormStore.editLock.expires_at) {
			const expiresAt = new Date(nceFormStore.editLock.expires_at)
			if (expiresAt < new Date()) {
				toast.error(
					"Your edit lock has expired. Please re-acquire the lock before saving.",
					{ duration: 5000 },
				)
				return true
			}
		}
		return false
	}

	/**
	 * Save the current form. Returns true on success.
	 */
	async function handleSave(): Promise<boolean> {
		if (isLockExpired()) return false

		const success = await nceFormStore.save()
		if (success) {
			toast.success("Saved successfully")
		} else {
			const saveError = nceFormStore.validationErrors["_save"]
			toast.error(saveError || "Save failed — check validation errors")
		}
		return success
	}

	/**
	 * Save then submit the current form.
	 */
	async function handleSubmit(): Promise<boolean> {
		const saved = await handleSave()
		if (!saved) return false

		if (!nceFormStore.targetDoctype || !nceFormStore.currentDocname) return false

		try {
			await call("frappe.client.submit", {
				doctype: nceFormStore.targetDoctype,
				name: nceFormStore.currentDocname,
			})
			toast.success("Submitted successfully")
			await nceFormStore.loadRecord(nceFormStore.currentDocname)
			return true
		} catch (err: any) {
			toast.error(err?.message || "Submit failed")
			return false
		}
	}

	return {
		isLockExpired,
		handleSave,
		handleSubmit,
	}
}
