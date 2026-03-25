// NCE Studio — Theme Defaults
// Theme configuration and reactive state management

import { ref, watch, computed, type Ref } from "vue";
import type { ColorShade, ThemeSettings } from "@nce/types";
import { generateShades } from "./colorShades";

// Default theme colors (hex)
const DEFAULT_COLORS = {
	primary: "#3B82F6",
	secondary: "#6B7280",
	accent: "#10B981",
	success: "#10B981",
	warning: "#F59E0B",
	danger: "#EF4444",
	info: "#3B82F6",
	neutral: "#9CA3AF",
	text: "#1F2937",
	textMuted: "#6B7280",
	background: "#FFFFFF",
	surface: "#F9FAFB",
	border: "#E5E7EB",
	link: "#3B82F6",
	focusRing: "#3B82F6",
	shadow: "#000000",
};

// Base color palette (step → lightness multiplier)
const SHADE_LIGHTNESS = {
	50: 0.99,
	100: 0.94,
	200: 0.88,
	300: 0.75,
	400: 0.65,
	500: 0.55,
	600: 0.45,
	700: 0.38,
	800: 0.32,
	900: 0.25,
	950: 0.15,
};

// Theme defaults
export const THEME_DEFAULTS: ThemeSettings = {
	// Colours
	primary_color: DEFAULT_COLORS.primary,
	secondary_color: DEFAULT_COLORS.secondary,
	accent_color: DEFAULT_COLORS.accent,
	success_color: DEFAULT_COLORS.success,
	warning_color: DEFAULT_COLORS.warning,
	danger_color: DEFAULT_COLORS.danger,
	info_color: DEFAULT_COLORS.info,
	gray_color: DEFAULT_COLORS.neutral,
	text_color: DEFAULT_COLORS.text,
	text_muted_color: DEFAULT_COLORS.textMuted,
	background_color: DEFAULT_COLORS.background,
	surface_color: DEFAULT_COLORS.surface,
	border_color: DEFAULT_COLORS.border,
	link_color: DEFAULT_COLORS.link,
	focus_ring_color: DEFAULT_COLORS.focusRing,
	shadow_color: DEFAULT_COLORS.shadow,
	// Typography
	font_family:
		"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
	font_size_base: "1rem",
	font_weight_base: "400",
	line_height_base: "1.5",
	// Layout
	border_radius: "0.375rem",
	spacing_unit: "0.25rem",
	shadow_style: "sm",
	max_content_width: "1280px",
	sidebar_width: "280px",
	transition_speed: "0.2s",
	// Custom
	custom_css: "",
	tailwind_overrides: "",
};

// CSS variable mappings for color shades
export const CSS_VARIABLE_MAPPING: Record<string, string> = {
	primary: "--nce-primary",
	secondary: "--nce-secondary",
	accent: "--nce-accent",
	success: "--nce-success",
	warning: "--nce-warning",
	danger: "--nce-danger",
	info: "--nce-info",
	neutral: "--nce-neutral",
	text: "--nce-text",
	textMuted: "--nce-text-muted",
	background: "--nce-background",
	surface: "--nce-surface",
	border: "--nce-border",
	link: "--nce-link",
	focusRing: "--nce-focus-ring",
	shadow: "--nce-shadow",
};

// Generate complete color palette with shades
export function generateColorPalette(colorHex: string): Map<number, string> {
	const shades = generateShades(colorHex, 11);
	const palette = new Map<number, string>();

	for (const shade of shades) {
		palette.set(shade.step, shade.hex);
	}

	return palette;
}

// Apply theme CSS variables to document root
export function applyToRoot(themeState: ThemeSettings): void {
	const root = document.documentElement;

	// Color variables (base colors)
	root.style.setProperty("--nce-primary", themeState.primary_color);
	root.style.setProperty("--nce-secondary", themeState.secondary_color);
	root.style.setProperty("--nce-accent", themeState.accent_color);
	root.style.setProperty("--nce-success", themeState.success_color);
	root.style.setProperty("--nce-warning", themeState.warning_color);
	root.style.setProperty("--nce-danger", themeState.danger_color);
	root.style.setProperty("--nce-info", themeState.info_color);
	root.style.setProperty("--nce-neutral", themeState.gray_color);
	root.style.setProperty("--nce-text", themeState.text_color);
	root.style.setProperty("--nce-text-muted", themeState.text_muted_color);
	root.style.setProperty("--nce-background", themeState.background_color);
	root.style.setProperty("--nce-surface", themeState.surface_color);
	root.style.setProperty("--nce-border", themeState.border_color);
	root.style.setProperty("--nce-link", themeState.link_color);
	root.style.setProperty("--nce-focus-ring", themeState.focus_ring_color);
	root.style.setProperty("--nce-shadow", themeState.shadow_color);

	// Typography variables
	root.style.setProperty("--nce-font-family", themeState.font_family);
	root.style.setProperty("--nce-font-size-base", themeState.font_size_base);
	root.style.setProperty(
		"--nce-font-weight-base",
		themeState.font_weight_base,
	);
	root.style.setProperty(
		"--nce-line-height-base",
		themeState.line_height_base,
	);

	// Layout variables
	root.style.setProperty("--nce-border-radius", themeState.border_radius);
	root.style.setProperty("--nce-spacing-unit", themeState.spacing_unit);
	root.style.setProperty(
		"--nce-max-content-width",
		themeState.max_content_width,
	);
	root.style.setProperty("--nce-sidebar-width", themeState.sidebar_width);
	root.style.setProperty(
		"--nce-transition-speed",
		themeState.transition_speed,
	);

	// Shadow variables based on shadow_style
	const shadowMap: Record<string, string> = {
		sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
		DEFAULT:
			"0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
		md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
		lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
		xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
	};
	root.style.setProperty("--nce-shadow-sm", shadowMap.sm);
	root.style.setProperty(
		"--nce-shadow",
		shadowMap[themeState.shadow_style] || shadowMap.DEFAULT,
	);
	root.style.setProperty("--nce-shadow-md", shadowMap.md);
	root.style.setProperty("--nce-shadow-lg", shadowMap.lg);
	root.style.setProperty("--nce-shadow-xl", shadowMap.xl);
}

// Theme state composable
export interface ThemeState {
	colors: Map<string, Map<number, string>>;
	settings: ThemeSettings;
}

export function useThemeState(): {
	themeState: Ref<ThemeSettings>;
	colorPalettes: Ref<Map<string, Map<number, string>>>;
	updateColor: (colorName: string, shade: number, hex: string) => void;
	applyTheme: () => void;
	resetToDefaults: () => void;
	loadTheme: () => void;
	saveTheme: () => void;
} {
	const themeState = ref<ThemeSettings>(
		JSON.parse(JSON.stringify(THEME_DEFAULTS)),
	);
	const colorPalettes = ref<Map<string, Map<number, string>>>(new Map());

	// Generate initial color palettes
	function generatePalettes() {
		const palettes = new Map<string, Map<number, string>>();
		const colorKeys = [
			"primary",
			"secondary",
			"accent",
			"success",
			"warning",
			"danger",
			"info",
			"neutral",
		] as const;

		for (const key of colorKeys) {
			const hex = themeState.value[
				`${key}_color` as keyof ThemeSettings
			] as string;
			palettes.set(key, generateColorPalette(hex));
		}

		colorPalettes.value = palettes;
	}

	// Update a color and regenerate its palette
	function updateColor(colorName: string, shade: number, hex: string) {
		const key = `${colorName}_color` as keyof ThemeSettings;
		themeState.value[key] = hex;

		// Regenerate palette for this color
		const palette = generateColorPalette(hex);
		colorPalettes.value.set(colorName, palette);

		applyToRoot(themeState.value);
		saveTheme();
	}

	// Apply current theme to DOM
	function applyTheme() {
		applyToRoot(themeState.value);
	}

	// Reset to defaults
	function resetToDefaults() {
		themeState.value = JSON.parse(JSON.stringify(THEME_DEFAULTS));
		generatePalettes();
		applyToRoot(themeState.value);
		saveTheme();
	}

	// Load theme from localStorage
	function loadTheme() {
		try {
			const stored = localStorage.getItem("nce-theme");
			if (stored) {
				const parsed = JSON.parse(stored);
				themeState.value = { ...THEME_DEFAULTS, ...parsed };
			}
		} catch {
			// Ignore errors, use defaults
		}
		generatePalettes();
		applyToRoot(themeState.value);
	}

	// Save theme to localStorage
	function saveTheme() {
		try {
			localStorage.setItem("nce-theme", JSON.stringify(themeState.value));
		} catch {
			// Ignore storage errors
		}
	}

	// Initialize
	loadTheme();

	// Watch for changes and auto-apply
	watch(
		themeState,
		() => {
			applyToRoot(themeState.value);
		},
		{ deep: true },
	);

	return {
		themeState,
		colorPalettes,
		updateColor,
		applyTheme,
		resetToDefaults,
		loadTheme,
		saveTheme,
	};
}
