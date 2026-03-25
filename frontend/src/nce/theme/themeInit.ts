// NCE Studio — Theme Initialisation
// Called once from main.ts after the Vue app mounts.
// Loads persisted theme settings (or defaults) and injects CSS variables
// into the document root so the UI is styled before first render.

import { loadPersistedTheme, injectTheme } from "./themeInjector"
import type { ThemeSettings } from "@nce/types"

/**
 * Initialise the NCE theme system on app startup.
 *
 * 1. Loads settings from localStorage (falls back to THEME_DEFAULTS).
 * 2. Injects all --nce-* CSS variables into :root.
 * 3. Optionally fetches fresh settings from the Frappe backend and
 *    re-injects if the server has a saved NCE Theme Settings record.
 *
 * This function is safe to call before or after app.mount() — it only
 * manipulates document.documentElement.style, not the Vue component tree.
 */
export async function initializeTheme(): Promise<void> {
	// Step 1 — apply persisted / default theme immediately (synchronous)
	// so there is no flash of unstyled content while the network request runs.
	const localSettings = loadPersistedTheme()
	injectTheme(localSettings)

	// Step 2 — attempt to fetch the canonical settings from the backend.
	// We do this after the initial paint so it never blocks the app from loading.
	try {
		const response = await (window as any).frappe?.call({
			method: "studio.api.nce_api.get_theme_settings",
		})

		const serverSettings = response?.message as Partial<ThemeSettings> | undefined

		if (serverSettings && Object.keys(serverSettings).length > 0) {
			const merged: ThemeSettings = { ...localSettings, ...serverSettings }
			injectTheme(merged)

			// Persist the server settings locally so the next page load is instant.
			try {
				localStorage.setItem("nce-theme", JSON.stringify(merged))
			} catch {
				// ignore quota errors
			}
		}
	} catch {
		// Network / permission errors are non-fatal — local theme is already applied.
	}
}
