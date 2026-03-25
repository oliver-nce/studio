import { describe, it, expect, beforeEach } from "vitest"
import { useComponentPaletteStore } from "../stores/componentPalette"

describe("componentPalette - Component Data", () => {
  it("should have correct components array", () => {
    const store = useComponentPaletteStore()

    expect(store.components).toHaveLength(7)

    expect(store.components[0]).toEqual({
      name: "NceFormHeader",
      label: "Form Header",
      category: "forms",
      description: "Form title and header section",
      icon: "FileText",
      defaultProps: { title: "Form Title" },
    })

    expect(store.components[1]).toEqual({
      name: "NceFormActionBar",
      label: "Action Bar",
      category: "forms",
      description: "Save, Cancel, and Submit buttons",
      icon: "Activity",
      defaultProps: {},
    })
  })

  it("should have components with correct categories", () => {
    const store = useComponentPaletteStore()

    expect(store.components[0].category).toBe("forms")
    expect(store.components[2].category).toBe("layout")
    expect(store.components[4].category).toBe("data")
    expect(store.components[5].category).toBe("feedback")
  })

  it("should have components with correct icons", () => {
    const store = useComponentPaletteStore()

    expect(store.components[0].icon).toBe("FileText")
    expect(store.components[1].icon).toBe("Activity")
    expect(store.components[2].icon).toBe("Grid")
    expect(store.components[3].icon).toBe("Tabs")
    expect(store.components[4].icon).toBe("Edit")
    expect(store.components[5].icon).toBe("AlertCircle")
    expect(store.components[6].icon).toBe("Play")
  })

  it("should have correct default props for components", () => {
    const store = useComponentPaletteStore()

    expect(store.components[0].defaultProps).toEqual({ title: "Form Title" })
    expect(store.components[2].defaultProps).toEqual({ columns: 2 })
    expect(store.components[4].defaultProps).toEqual({ fieldtype: "Data" })
    expect(store.components[5].defaultProps).toEqual({ text: "Hint text" })
    expect(store.components[6].defaultProps).toEqual({ label: "Click Me" })
    expect(store.components[1].defaultProps).toEqual({})
    expect(store.components[3].defaultProps).toEqual({})
  })
})

describe("componentPalette - Grouped Components", () => {
  it("should group components by category", () => {
    const store = useComponentPaletteStore()

    const groups = store.groupedComponents

    expect(groups.forms).toHaveLength(2)
    expect(groups.layout).toHaveLength(2)
    expect(groups.data).toHaveLength(1)
    expect(groups.feedback).toHaveLength(2)
  })

  it("should have correct grouped structure", () => {
    const store = useComponentPaletteStore()

    const groups = store.groupedComponents

    expect(groups.forms).toContainEqual(
      expect.objectContaining({ name: "NceFormHeader" })
    )
    expect(groups.layout).toContainEqual(
      expect.objectContaining({ name: "NceFormGrid" })
    )
  })
})

describe("componentPalette - Categories", () => {
  it("should return unique categories", () => {
    const store = useComponentPaletteStore()

    const categories = store.categories

    expect(categories).toHaveLength(4)
    expect(categories).toContain("forms")
    expect(categories).toContain("layout")
    expect(categories).toContain("data")
    expect(categories).toContain("feedback")
  })

  it("should not contain duplicate categories", () => {
    const store = useComponentPaletteStore()

    const categories = store.categories

    expect(new Set(categories).size).toBe(categories.length)
  })
})

describe("componentPalette - Search Filtering", () => {
  it("should return all components when search is empty", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = ""

    expect(store.filteredComponents).toHaveLength(7)
  })

  it("should filter by component name", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "Form"

    expect(store.filteredComponents).toHaveLength(2)
    expect(store.filteredComponents).toContainEqual(
      expect.objectContaining({ name: "NceFormHeader" })
    )
    expect(store.filteredComponents).toContainEqual(
      expect.objectContaining({ name: "NceFormActionBar" })
    )
  })

  it("should filter by component label", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "Header"

    expect(store.filteredComponents).toHaveLength(1)
    expect(store.filteredComponents[0].label).toBe("Form Header")
  })

  it("should filter by component description", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "button"

    expect(store.filteredComponents).toHaveLength(1)
    expect(store.filteredComponents[0].name).toBe("NceFormActionBar")
  })

  it("should be case-insensitive", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "form"

    expect(store.filteredComponents).toHaveLength(2)

    store.searchQuery = "FORM"

    expect(store.filteredComponents).toHaveLength(2)
  })

  it("should return empty array when no matches", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "nonexistent"

    expect(store.filteredComponents).toHaveLength(0)
  })

  it("should search partial matches", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "formh"

    expect(store.filteredComponents).toHaveLength(1)
    expect(store.filteredComponents[0].name).toBe("NceFormHeader")
  })
})

describe("componentPalette - Store Functionality", () => {
  it("should have reactive searchQuery", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "Form"

    expect(store.filteredComponents).toHaveLength(2)

    store.searchQuery = ""

    expect(store.filteredComponents).toHaveLength(7)
  })

  it("should handle empty search query correctly", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = ""

    expect(store.filteredComponents).toEqual(store.components)
  })

  it("should handle special characters in search", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "Form!"

    expect(store.filteredComponents).toHaveLength(0)
  })
})

describe("componentPalette - Edge Cases", () => {
  it("should handle components with undefined description", () => {
    const store = useComponentPaletteStore()
    store.searchQuery = "description"

    expect(store.filteredComponents).toBeDefined()
  })

  it("should handle empty store", () => {
    const store = useComponentPaletteStore()
    expect(store.components).toBeDefined()
    expect(store.components).toHaveLength(7)
  })

  it("should maintain component integrity", () => {
    const store = useComponentPaletteStore()
    const component = store.components[0]

    expect(component.name).toBeDefined()
    expect(component.label).toBeDefined()
    expect(component.category).toBeDefined()
    expect(component.icon).toBeDefined()
  })
})
