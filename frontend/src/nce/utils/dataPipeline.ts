import { call } from "frappe-ui";
import type {
	ResolvedFields,
	FieldValue,
	SaveResult,
	EditLock,
	FormDefinition,
} from "@nce/types";

const API_BASE = "studio.api.nce_api";

/**
 * Read data through link chains.
 * Resolves dot-notation field paths against a root document.
 */
export async function resolveFields(
	doctype: string,
	docname: string,
	fieldPaths: string[],
): Promise<ResolvedFields> {
	return await call(`${API_BASE}.resolve_fields`, {
		doctype,
		docname,
		field_paths: fieldPaths,
	});
}

/**
 * Write changed data back through link chains.
 * Groups updates by target document and saves each.
 */
export async function saveResolvedFields(
	doctype: string,
	docname: string,
	fieldValues: FieldValue,
	lockToken?: string,
): Promise<SaveResult> {
	return await call(`${API_BASE}.save_resolved_fields`, {
		doctype,
		docname,
		field_values: fieldValues,
		lock_token: lockToken,
	});
}

/**
 * Check if a record is currently edit-locked.
 */
export async function checkEditLock(
	doctype: string,
	docname: string,
): Promise<EditLock> {
	return await call(`${API_BASE}.check_edit_lock`, {
		doctype,
		docname,
	});
}

/**
 * Acquire an edit lock for the current user.
 */
export async function acquireEditLock(
	doctype: string,
	docname: string,
	durationMinutes = 15,
): Promise<EditLock> {
	return await call(`${API_BASE}.acquire_edit_lock`, {
		doctype,
		docname,
		duration_minutes: durationMinutes,
	});
}

/**
 * Release the current user's edit lock.
 */
export async function releaseEditLock(
	doctype: string,
	docname: string,
): Promise<{ released: boolean }> {
	return await call(`${API_BASE}.release_edit_lock`, {
		doctype,
		docname,
	});
}

/**
 * Return a random document name for a given DocType.
 * Used by form runtime for record selection / preview.
 */
export async function getRandomDocName(
	doctype: string,
): Promise<string | null> {
	return await call(`${API_BASE}.get_random_doc_name`, {
		doctype,
	});
}

/**
 * Fetch an NCE Form Definition document by name.
 */
export async function getFormDefinition(
	formName: string,
): Promise<FormDefinition> {
	return await call("frappe.client.get", {
		doctype: "NCE Form Definition",
		name: formName,
	});
}

/**
 * Regenerate the site-wide NCE theme CSS file from current settings.
 */
export async function regenerateThemeCss(): Promise<{
	status: string;
	message: string;
}> {
	return await call(`${API_BASE}.regenerate_theme_css`);
}
