import { describe, it, expect } from "vitest"
import {
  hexToOklch,
  oklchToHex,
  generateShades,
  isDark,
  gamutMap,
  rgbToOklch,
  oklchToRgb,
} from "../theme/colorShades"

describe("colorShades - Color Conversion", () => {
  describe("hexToOklch", () => {
    it("should convert hex to OKLCH correctly", () => {
      const result = hexToOklch("#FF0000")
      expect(result.l).toBeCloseTo(0.647, 3)
      expect(result.c).toBeCloseTo(0.32, 2)
      expect(result.h).toBeCloseTo(33, 0)
    })

    it("should handle white", () => {
      const result = hexToOklch("#FFFFFF")
      expect(result.l).toBeCloseTo(1, 3)
      expect(result.c).toBeCloseTo(0, 3)
    })

    it("should handle black", () => {
      const result = hexToOklch("#000000")
      expect(result.l).toBeCloseTo(0, 3)
      expect(result.c).toBeCloseTo(0, 3)
    })
  })

  describe("oklchToHex", () => {
    it("should convert OKLCH to hex", () => {
      const result = oklchToHex(0.647, 0.32, 33)
      expect(result).toBe("#ff0000")
    })

    it("should handle white", () => {
      const result = oklchToHex(1, 0, 0)
      expect(result).toBe("#ffffff")
    })
  })

  describe("rgbToOklch and oklchToRgb", () => {
    it("should round-trip RGB to OKLCH", () => {
      const original = [1, 0, 0]
      const oklch = rgbToOklch(original[0], original[1], original[2])
      const back = oklchToRgb(oklch.l, oklch.c, oklch.h)
      expect(back[0]).toBeCloseTo(original[0], 1)
      expect(back[2]).toBeCloseTo(original[2], 1)
    })
  })
})

describe("colorShades - Gamut Mapping", () => {
  describe("gamutMap", () => {
    it("should keep valid colors within gamut", () => {
      const result = gamutMap(0.5, 0.1, 180)
      expect(result.l).toBeCloseTo(0.5)
      expect(result.c).toBeCloseTo(0.1)
    })

    it("should reduce chroma for out-of-gamut colors", () => {
      const result = gamutMap(0.8, 0.5, 120)
      expect(result.c).toBeLessThan(0.5)
      expect(result.c).toBeGreaterThan(0)
    })

    it("should clamp lightness to [0, 1] range", () => {
      const result = gamutMap(1.5, 0.1, 180)
      expect(result.l).toBeCloseTo(1)
      const result2 = gamutMap(-0.1, 0.1, 180)
      expect(result2.l).toBeCloseTo(0)
    })
  })
})

describe("colorShades - Shade Generation", () => {
  describe("generateShades", () => {
    it("should generate 11 shades by default", () => {
      const shades = generateShades("#3B82F6")
      expect(shades.length).toBe(11)
    })

    it("should generate shades in descending step order", () => {
      const shades = generateShades("#3B82F6")
      expect(shades[0].step).toBe(950)
      expect(shades[1].step).toBe(900)
    })

    it("should return valid hex colors", () => {
      const shades = generateShades("#10B981")
      shades.forEach((shade) => {
        expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/)
        expect(shade.oklch).toHaveLength(3)
      })
    })
  })

  describe("isDark", () => {
    it("should return true for lightness < 0.5", () => {
      expect(isDark(0.4)).toBe(true)
      expect(isDark(0)).toBe(true)
    })

    it("should return false for lightness >= 0.5", () => {
      expect(isDark(0.5)).toBe(false)
      expect(isDark(1)).toBe(false)
    })
  })
})
