import { describe, it, expect, beforeEach, vi } from "vitest"
import { useThemeState, THEME_DEFAULTS, applyToRoot, generateColorPalette } from "../theme/useThemeDefaults"

const mockStorage: Record<string, string> = {}

const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value
  },
  removeItem: (key: string) => {
    delete mockStorage[key]
  },
  clear: () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  },
}

vi.stubGlobal("localStorage", localStorageMock)

describe("useThemeDefaults - Default Values", () => {
  it("should have correct default colors", () => {
    expect(THEME_DEFAULTS.primary_color).toBe("#3B82F6")
    expect(THEME_DEFAULTS.secondary_color).toBe("#6B7280")
    expect(THEME_DEFAULTS.accent_color).toBe("#10B981")
    expect(THEME_DEFAULTS.success_color).toBe("#10B981")
    expect(THEME_DEFAULTS.warning_color).toBe("#F59E0B")
    expect(THEME_DEFAULTS.danger_color).toBe("#EF4444")
    expect(THEME_DEFAULTS.info_color).toBe("#3B82F6")
    expect(THEME_DEFAULTS.neutral_color).toBe("#9CA3AF")
    expect(THEME_DEFAULTS.text_color).toBe("#1F2937")
    expect(THEME_DEFAULTS.text_muted_color).toBe("#6B7280")
    expect(THEME_DEFAULTS.background_color).toBe("#FFFFFF")
    expect(THEME_DEFAULTS.surface_color).toBe("#F9FAFB")
    expect(THEME_DEFAULTS.border_color).toBe("#E5E7EB")
    expect(THEME_DEFAULTS.link_color).toBe("#3B82F6")
    expect(THEME_DEFAULTS.focus_ring_color).toBe("#3B82F6")
    expect(THEME_DEFAULTS.shadow_color).toBe("#000000")
  })

  it("should have correct default typography settings", () => {
    expect(THEME_DEFAULTS.font_family).toBe("Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
    expect(THEME_DEFAULTS.font_size_base).toBe("1rem")
    expect(THEME_DEFAULTS.font_weight_base).toBe("400")
    expect(THEME_DEFAULTS.line_height_base).toBe("1.5")
  })

  it("should have correct default layout settings", () => {
    expect(THEME_DEFAULTS.border_radius).toBe("0.375rem")
    expect(THEME_DEFAULTS.spacing_unit).toBe("0.25rem")
    expect(THEME_DEFAULTS.shadow_style).toBe("sm")
    expect(THEME_DEFAULTS.max_content_width).toBe("1280px")
    expect(THEME_DEFAULTS.sidebar_width).toBe("280px")
    expect(THEME_DEFAULTS.transition_speed).toBe("0.2s")
  })
})

describe("useThemeDefaults - Color Palette Generation", () => {
  it("should generate 11 shades for a color", () => {
    const palette = generateColorPalette("#3B82F6")
    expect(palette.size).toBe(11)
    expect(palette.has(50)).toBe(true)
    expect(palette.has(950)).toBe(true)
  })

  it("should generate valid hex colors in palette", () => {
    const palette = generateColorPalette("#10B981")
    for (const [step, hex] of palette) {
      expect(step).toBeTypeOf("number")
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe("useThemeDefaults - applyToRoot", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should set all color CSS variables", () => {
    const rootStyle = {
      setProperty: vi.fn(),
    }
    vi.stubGlobal("document", {
      documentElement: {
        style: rootStyle,
      },
    })

    applyToRoot(THEME_DEFAULTS)

    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-primary", "#3B82F6")
    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-text", "#1F2937")
  })

  it("should set typography CSS variables", () => {
    const rootStyle = {
      setProperty: vi.fn(),
    }
    vi.stubGlobal("document", {
      documentElement: {
        style: rootStyle,
      },
    })

    applyToRoot(THEME_DEFAULTS)

    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-font-family", "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-font-size-base", "1rem")
  })

  it("should set layout CSS variables", () => {
    const rootStyle = {
      setProperty: vi.fn(),
    }
    vi.stubGlobal("document", {
      documentElement: {
        style: rootStyle,
      },
    })

    applyToRoot(THEME_DEFAULTS)

    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-border-radius", "0.375rem")
    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-sidebar-width", "280px")
  })

  it("should set shadow CSS variables", () => {
    const rootStyle = {
      setProperty: vi.fn(),
    }
    vi.stubGlobal("document", {
      documentElement: {
        style: rootStyle,
      },
    })

    applyToRoot(THEME_DEFAULTS)

    expect(rootStyle.setProperty).toHaveBeenCalledWith("--nce-shadow-sm", "0 1px 2px 0 rgb(0 0 0 / 0.05)")
  })
})

describe("useThemeDefaults - useThemeState", () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
  })

  it("should initialize with default theme settings", () => {
    const result = useThemeState()

    expect(result.themeState.value.primary_color).toBe("#3B82F6")
    expect(result.themeState.value.background_color).toBe("#FFFFFF")
    expect(result.colorPalettes.value.size).toBeGreaterThan(0)
  })

  it("should generate color palettes for all color keys", () => {
    const result = useThemeState()
    const keys = Array.from(result.colorPalettes.value.keys())

    expect(keys).toContain("primary")
    expect(keys).toContain("secondary")
    expect(keys).toContain("accent")
  })

  it("should update color and regenerate palette", () => {
    const result = useThemeState()
    result.updateColor("primary", 500, "#FF0000")

    expect(result.themeState.value.primary_color).toBe("#FF0000")
    expect(result.colorPalettes.value.get("primary")?.get(500)).toBe("#FF0000")
  })

  it("should save theme to localStorage when updating color", () => {
    const result = useThemeState()
    result.updateColor("primary", 500, "#00FF00")

    const stored = localStorageMock.getItem("nce-theme")
    expect(stored).toBeDefined()

    const parsed = JSON.parse(stored!)
    expect(parsed.primary_color).toBe("#00FF00")
  })

  it("should reset to defaults", () => {
    const result = useThemeState()
    result.themeState.value.primary_color = "#FF0000"
    expect(result.themeState.value.primary_color).toBe("#FF0000")

    result.resetToDefaults()
    expect(result.themeState.value.primary_color).toBe("#3B82F6")
  })

  it("should reload theme from localStorage", () => {
    const storedTheme = {
      primary_color: "#FF0000",
      background_color: "#000000",
    }
    localStorageMock.setItem("nce-theme", JSON.stringify(storedTheme))

    const result = useThemeState()
    result.loadTheme()

    expect(result.themeState.value.primary_color).toBe("#FF0000")
    expect(result.themeState.value.background_color).toBe("#000000")
  })

  it("should handle localStorage errors gracefully", () => {
    const errorStorage = {
      getItem: vi.fn(() => {
        throw new Error("Storage error")
      }),
      setItem: vi.fn(() => {
        throw new Error("Storage error")
      }),
      removeItem: () => {},
      clear: () => {},
    }
    vi.stubGlobal("localStorage", errorStorage)

    expect(() => useThemeState()).not.toThrow()
  })
})

describe("useThemeDefaults - Edge Cases", () => {
  it("should handle empty localStorage", () => {
    mockStorage.clear()

    const result = useThemeState()
    expect(result.themeState.value.primary_color).toBe("#3B82F6")
  })

  it("should handle invalid localStorage data", () => {
    localStorageMock.setItem("nce-theme", "{ invalid json")

    expect(() => useThemeState()).not.toThrow()
  })

  it("should handle theme with only partial overrides", () => {
    const partialTheme = {
      primary_color: "#FF0000",
    }
    localStorageMock.setItem("nce-theme", JSON.stringify(partialTheme))

    const result = useThemeState()
    expect(result.themeState.value.primary_color).toBe("#FF0000")
    expect(result.themeState.value.background_color).toBe("#FFFFFF")
  })
})
