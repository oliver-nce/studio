// NCE Studio — OKLCH Color Engine
// Utilities for working with OKLCH color space (perceptually uniform)

import type { ColorShade } from "@nce/types/index";

/**
 * Convert hex color to RGB values (0-1 range)
 */
function hexToRgb(hex: string): [number, number, number] {
	const cleanHex = hex.replace("#", "");
	const expandedHex =
		cleanHex.length === 3
			? cleanHex
					.split("")
					.map((c) => c + c)
					.join("")
			: cleanHex;

	const r = parseInt(expandedHex.slice(0, 2), 16);
	const g = parseInt(expandedHex.slice(2, 4), 16);
	const b = parseInt(expandedHex.slice(4, 6), 16);

	return [r / 255, g / 255, b / 255];
}

/**
 * Convert RGB (0-1 range) to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	r = clamp(r);
	g = clamp(g);
	b = clamp(b);

	const toInt = (v: number) => Math.round(v * 255);

	const hr = toInt(r).toString(16).padStart(2, "0");
	const hg = toInt(g).toString(16).padStart(2, "0");
	const hb = toInt(b).toString(16).padStart(2, "0");

	return `#${hr}${hg}${hb}`;
}

/**
 * Convert sRGB (0-1 range) to OKLCH
 */
function rgbToOklch(
	r: number,
	g: number,
	b: number,
): { l: number; c: number; h: number } {
	const toLinear = (v: number): number => {
		return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	};

	const linearR = toLinear(r);
	const linearG = toLinear(g);
	const linearB = toLinear(b);

	const x =
		linearR * 0.4122214708 +
		linearG * 0.3576028204 +
		linearB * 0.1805056061;
	const y =
		linearR * 0.212646139 + linearG * 0.7152056408 + linearB * 0.0721480195;
	const z =
		linearR * 0.0193317483 + linearG * 0.119192016 + linearB * 0.9503900843;

	const l = x * 0.8189646998 + y * 0.3618625094 + z * 0.0446329146;
	const m = x * 0.3618625094 + y * 0.6019214982 + z * 0.1220278077;
	const s = x * 0.0193317483 + y * 0.0265435934 + z * 0.9023397607;

	const okl = Math.cbrt(l);
	const okm = Math.cbrt(m);
	const oks = Math.cbrt(s);

	const l_star = 0.4122214708 * okl + 0.3618625094 * okm + 0.0446329146 * oks;
	const a = 0.3618625094 * okl + 0.6019214982 * okm + 0.1220278077 * oks;
	const b_val = 0.0193317483 * okl + 0.0265435934 * okm + 0.9023397607 * oks;

	const c = Math.sqrt(a * a + b_val * b_val);
	let h = Math.atan2(b_val, a) * (180 / Math.PI);

	if (h < 0) h += 360;
	if (h >= 360) h -= 360;

	return {
		l: Math.max(0, Math.min(1, l_star)),
		c: Math.max(0, Math.min(0.4, c)),
		h,
	};
}

/**
 * Convert OKLCH to RGB (0-1 range)
 */
function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
	l = Math.max(0, Math.min(1, l));
	c = Math.max(0, Math.min(0.4, c));

	const hRad = h * (Math.PI / 180);
	const a = c * Math.cos(hRad);
	const b_val = c * Math.sin(hRad);

	const okl = l;
	const okm = l + a * 0.3963377774 + b_val * 0.2158037573;
	const oks = l + a * -0.1055613458 + b_val * -0.0638541728;

	const l_val = okl * okl * okl;
	const m_val = okm * okm * okm;
	const s_val = oks * oks * oks;

	const x =
		l_val * 0.4122214708 + m_val * 0.3618625094 + s_val * 0.0193317483;
	const y = l_val * 0.212646139 + m_val * 0.6019214982 + s_val * 0.0265435934;
	const z =
		l_val * 0.0193317483 + m_val * 0.1220278077 + s_val * 0.9503900843;

	const linearR = x * 3.2406 + y * -1.5372 + z * -0.4986;
	const linearG = x * -0.9689 + y * 1.8758 + z * 0.0415;
	const linearB = x * 0.0557 + y * -0.204 + z * 1.057;

	const toSrgb = (v: number): number => {
		return v <= 0.0031308
			? v * 12.92
			: 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
	};

	return [toSrgb(linearR), toSrgb(linearG), toSrgb(linearB)];
}

/**
 * Map OKLCH values to valid sRGB gamut
 */
export function gamutMap(
	l: number,
	c: number,
	h: number,
): { l: number; c: number; h: number } {
	l = Math.max(0, Math.min(1, l));

	let currentC = c;
	const maxIterations = 8;

	for (let i = 0; i < maxIterations; i++) {
		const [r, g, b] = oklchToRgb(l, currentC, h);

		if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
			return { l, c: currentC, h };
		}

		currentC *= 0.5;
	}

	return { l, c: currentC, h };
}

/**
 * Convert hex to OKLCH color object
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
	const [r, g, b] = hexToRgb(hex);
	return rgbToOklch(r, g, b);
}

/**
 * Convert OKLCH to hex color
 */
export function oklchToHex(l: number, c: number, h: number): string {
	const mapped = gamutMap(l, c, h);
	const [r, g, b] = oklchToRgb(mapped.l, mapped.c, mapped.h);
	return rgbToHex(r, g, b);
}

/**
 * Generate color shades using OKLCH interpolation
 */
export function generateShades(
	baseHex: string,
	numShades: number = 11,
): ColorShade[] {
	const baseOklch = hexToOklch(baseHex);
	const lightnessSteps = [
		0.99, 0.97, 0.94, 0.91, 0.88, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35,
	];

	const shades: ColorShade[] = [];

	for (let i = 0; i < numShades; i++) {
		const step = 950 - i * 50;
		const l = lightnessSteps[i] ?? baseOklch.l;
		const chroma = l > 0.8 ? baseOklch.c * 0.9 * (l - 0.5) : baseOklch.c;
		const clampedC = Math.max(0, Math.min(chroma, 0.4));

		const {
			l: mappedL,
			c: mappedC,
			h: mappedH,
		} = gamutMap(l, clampedC, baseOklch.h);

		shades.push({
			step,
			hex: oklchToHex(mappedL, mappedC, mappedH),
			oklch: [mappedL, mappedC, mappedH],
		});
	}

	return shades.sort((a, b) => b.step - a.step);
}

/**
 * Determine if a color is dark based on its lightness
 */
export function isDark(l: number): boolean {
	return l < 0.5;
}

/**
 * Extract a single shade from a generated palette
 */
export function getShade(shades: ColorShade[], step: number): string | null {
	const shade = shades.find((s) => s.step === step);
	return shade ? shade.hex : null;
}
