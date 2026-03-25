// NCE Studio — Theme Injector
// Responsible for injecting NCE CSS variables into the document root.
// Called on app startup and whenever theme settings change.

import { THEME_DEFAULTS, applyToRoot } from "./useThemeDefaults"
import type { ThemeSettings } from "@nce/types"

const STORAGE_KEY = "nce-theme"

/**
 * Load persisted theme settings from localStorage.
 * Falls back to THEME_DEFAULTS if nothing is stored or parsing fails.
 */
export function loadPersistedTheme(): ThemeSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<ThemeSettings>
			return { ...THEME_DEFAULTS, ...parsed }
		}
	} catch {
		// ignore — use defaults
	}
	return { ...THEME_DEFAULTS }
}

/**
 * Persist theme settings to localStorage.
 */
export function persistTheme(settings: ThemeSettings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
	} catch {
		// ignore storage errors (e.g. private browsing quota)
	}
}

/**
 * Inject NCE CSS variables into the document root from the given settings.
 * If no settings are provided, the persisted (or default) theme is used.
 */
export function injectTheme(settings?: ThemeSettings): void {
	const resolved = settings ?? loadPersistedTheme()
	applyToRoot(resolved)
}

/**
 * Remove all --nce-* CSS variables from the document root.
 * Useful for testing or theme reset flows.
 */
export function removeTheme(): void {
	const root = document.documentElement
	const toRemove: string[] = []

	for (let i = 0; i < root.style.length; i++) {
		const prop = root.style.item(i)
		if (prop.startsWith("--nce-")) {
			toRemove.push(prop)
		}
	}

	toRemove.forEach((prop) => root.style.removeProperty(prop))
}
