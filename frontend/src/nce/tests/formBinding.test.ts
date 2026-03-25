import { describe, it, expect } from "vitest"
import type { FormDefinition } from "@nce/types"
import {
  validateFieldPath,
  bindPathFinderToField,
  createFieldFromPath,
  getTerminalFieldName,
  getParentPath,
  isDirectField,
  formatPathForDisplay,
  isPathMapped,
  findPathMatches,
  addFieldBinding,
} from "../utils/formBinding"

describe("formBinding - Path Validation", () => {
  describe("validateFieldPath", () => {
    it("should validate a simple field path", () => {
      const result = validateFieldPath("name", "Customer")
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should validate a nested path", () => {
      const result = validateFieldPath("customer.address.city", "Order")
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject empty paths", () => {
      const result = validateFieldPath("", "Customer")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Path cannot be empty")
    })

    it("should reject paths with invalid characters", () => {
      const result = validateFieldPath("customer-name", "Customer")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Path contains invalid characters")
    })

    it("should reject paths starting with numbers", () => {
      const result = validateFieldPath("123customer", "Customer")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Field name '123customer' cannot start with a number")
    })

    it("should reject paths with empty segments", () => {
      const result = validateFieldPath("customer..address", "Customer")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Path contains empty segments")
    })
  })
})

describe("formBinding - Path Binding", () => {
  describe("bindPathFinderToField", () => {
    it("should bind a valid path", () => {
      const result = bindPathFinderToField("customer.name", "Customer")
      expect(result.fieldPath).toBe("customer.name")
      expect(result.resolvedPath).toEqual(["customer", "name"])
      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeUndefined()
    })

    it("should return error for invalid path", () => {
      const result = bindPathFinderToField("123invalid", "Customer")
      expect(result.fieldPath).toBe("123invalid")
      expect(result.resolvedPath).toEqual([])
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBeDefined()
    })

    it("should handle simple field path", () => {
      const result = bindPathFinderToField("name", "Customer")
      expect(result.resolvedPath).toEqual(["name"])
      expect(result.isValid).toBe(true)
    })
  })
})

describe("formBinding - Field Creation", () => {
  describe("createFieldFromPath", () => {
    it("should create field from simple path", () => {
      const result = createFieldFromPath("name", "Full Name", "Data")
      expect(result.id).toBe("name")
      expect(result.label).toBe("Full Name")
      expect(result.fieldtype).toBe("Data")
      expect(result.bindPath).toBe("name")
    })

    it("should generate ID from nested path", () => {
      const result = createFieldFromPath("customer.address.city")
      expect(result.id).toBe("customer_address_city")
    })

    it("should derive label from path segments", () => {
      const result = createFieldFromPath("customer.address.city")
      expect(result.label).toBe("City")
    })

    it("should handle snake_case paths", () => {
      const result = createFieldFromPath("customer.first_name")
      expect(result.label).toBe("First Name")
    })

    it("should use provided label over auto-generated", () => {
      const result = createFieldFromPath("customer.name", "Custom Label")
      expect(result.label).toBe("Custom Label")
    })

    it("should default fieldtype to Data", () => {
      const result = createFieldFromPath("customer.name")
      expect(result.fieldtype).toBe("Data")
    })
  })
})

describe("formBinding - Path Helpers", () => {
  describe("getTerminalFieldName", () => {
    it("should get terminal field name from simple path", () => {
      expect(getTerminalFieldName("name")).toBe("name")
    })

    it("should get terminal field name from nested path", () => {
      expect(getTerminalFieldName("customer.address.city")).toBe("city")
    })

    it("should get terminal field name from deeply nested path", () => {
      expect(getTerminalFieldName("a.b.c.d.e")).toBe("e")
    })
  })

  describe("getParentPath", () => {
    it("should return empty string for simple path", () => {
      expect(getParentPath("name")).toBe("")
    })

    it("should return parent path for nested path", () => {
      expect(getParentPath("customer.address.city")).toBe("customer.address")
    })

    it("should return parent for two-level path", () => {
      expect(getParentPath("customer.address")).toBe("customer")
    })
  })

  describe("isDirectField", () => {
    it("should return true for direct field", () => {
      expect(isDirectField("name")).toBe(true)
    })

    it("should return false for nested path", () => {
      expect(isDirectField("customer.name")).toBe(false)
    })
  })

  describe("formatPathForDisplay", () => {
    it("should return simple path for direct field", () => {
      expect(formatPathForDisplay("name")).toBe("name")
    })

    it("should format nested path with arrows", () => {
      expect(formatPathForDisplay("customer.address.city")).toBe("customer → address → city")
    })

    it("should handle three segments", () => {
      expect(formatPathForDisplay("a.b.c")).toBe("a → b → c")
    })
  })
})

describe("formBinding - Path Mapping", () => {
  describe("isPathMapped", () => {
    it("should return true for mapped path", () => {
      const fieldMapping = {
        name_field: "name",
        address_field: "address.city",
      }
      expect(isPathMapped("name", fieldMapping)).toBe(true)
      expect(isPathMapped("address.city", fieldMapping)).toBe(true)
    })

    it("should return false for unmapped path", () => {
      const fieldMapping = {
        name_field: "name",
      }
      expect(isPathMapped("address", fieldMapping)).toBe(false)
    })
  })

  describe("findPathMatches", () => {
    it("should find matching paths in field_mapping", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {
          name: "customer.name",
          address: "customer.address.city",
        },
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const matches = findPathMatches(formDef, "customer")
      expect(matches).toContain("customer.name")
      expect(matches).toContain("customer.address.city")
    })

    it("should handle no matches", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {
          name: "name",
        },
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const matches = findPathMatches(formDef, "customer")
      expect(matches).toEqual([])
    })

    it("should remove duplicates", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {
          name1: "customer.name",
          name2: "customer.name",
        },
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const matches = findPathMatches(formDef, "customer")
      expect(matches.length).toBe(1)
      expect(matches).toContain("customer.name")
    })
  })

  describe("addFieldBinding", () => {
    it("should add new field binding", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {},
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const result = addFieldBinding(formDef, "customer.name", "Customer Name", "Data")
      expect(result.field_mapping).toEqual({
        customer_name: "customer.name",
      })
    })

    it("should generate unique IDs for duplicate paths", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {
          customer_name: "customer.name",
        },
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const result = addFieldBinding(formDef, "customer.name", "Customer Name", "Data")
      expect(result.field_mapping).toEqual({
        customer_name: "customer.name",
        customer_name_1: "customer.name",
      })
    })

    it("should preserve existing fields", () => {
      const formDef: FormDefinition = {
        name: "Test Form",
        form_title: "Test",
        target_doctype: "Customer",
        form_schema: {},
        field_mapping: {
          existing_field: "existing.path",
        },
        grid_layout: {},
        grid_config: {},
        tab_layout: [],
        submission_action: "Save",
      }

      const result = addFieldBinding(formDef, "new.field", "New Field", "Data")
      expect(result.field_mapping).toEqual({
        existing_field: "existing.path",
        new_field: "new.field",
      })
    })
  })
})

describe("formBinding - Edge Cases", () => {
  it("should handle paths with underscores", () => {
    const result = validateFieldPath("customer_first_name", "Customer")
    expect(result.valid).toBe(true)
  })

  it("should handle paths with numbers in segments (not at start)", () => {
    const result = validateFieldPath("field1.field2", "Test")
    expect(result.valid).toBe(true)
  })

  it("should handle very long paths", () => {
    const longPath = "a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p"
    const result = validateFieldPath(longPath, "Test")
    expect(result.valid).toBe(true)
  })

  it("should handle single underscore path", () => {
    const result = validateFieldPath("_", "Test")
    expect(result.valid).toBe(false)
  })

  it("should handle path with trailing dot", () => {
    const result = validateFieldPath("customer.", "Test")
    expect(result.valid).toBe(false)
  })
})
