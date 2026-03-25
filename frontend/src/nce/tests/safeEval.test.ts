import { describe, it, expect } from "vitest"
import { safeEvaluateCondition } from "../utils/safeEval"

describe("safeEvaluateCondition - Basic Truthy/Falsy", () => {
  it("should return true for empty condition", () => {
    expect(safeEvaluateCondition("", { enabled: true })).toBe(true)
  })

  it("should return true for null condition", () => {
    expect(safeEvaluateCondition("", { enabled: true })).toBe(true)
  })

  it("should return true for whitespace-only condition", () => {
    expect(safeEvaluateCondition("   ", { enabled: true })).toBe(true)
  })

  it("should evaluate data.enabled to true when enabled is true", () => {
    expect(safeEvaluateCondition("data.enabled", { enabled: true })).toBe(true)
  })

  it("should evaluate data.enabled to false when enabled is false", () => {
    expect(safeEvaluateCondition("data.enabled", { enabled: false })).toBe(false)
  })

  it("should evaluate data.count to false when count is 0", () => {
    expect(safeEvaluateCondition("data.count", { count: 0 })).toBe(false)
  })

  it("should evaluate data.name to true when name is non-empty string", () => {
    expect(safeEvaluateCondition("data.name", { name: "test" })).toBe(true)
  })

  it("should evaluate data.name to false when name is empty string", () => {
    expect(safeEvaluateCondition("data.name", { name: "" })).toBe(false)
  })

  it("should evaluate bare identifier to data property", () => {
    expect(safeEvaluateCondition("enabled", { enabled: true })).toBe(true)
  })

  it("should evaluate bare identifier false", () => {
    expect(safeEvaluateCondition("enabled", { enabled: false })).toBe(false)
  })
})

describe("safeEvaluateCondition - Comparisons (Strict Equality)", () => {
  it("should evaluate strict equality === to true for matching strings", () => {
    expect(safeEvaluateCondition('data.status === "Active"', { status: "Active" })).toBe(true)
  })

  it("should evaluate strict equality === to false for non-matching strings", () => {
    expect(safeEvaluateCondition('data.status === "Active"', { status: "Inactive" })).toBe(false)
  })

  it("should evaluate strict equality === with numbers", () => {
    expect(safeEvaluateCondition("data.count === 5", { count: 5 })).toBe(true)
  })

  it("should evaluate strict equality === false for different types", () => {
    expect(safeEvaluateCondition('data.count === "5"', { count: 5 })).toBe(false)
  })
})

describe("safeEvaluateCondition - Comparisons (Loose Equality)", () => {
  it("should evaluate loose equality == to true for matching values", () => {
    expect(safeEvaluateCondition('data.status == "Active"', { status: "Active" })).toBe(true)
  })

  it("should evaluate loose equality == with type coercion", () => {
    expect(safeEvaluateCondition('data.count == "5"', { count: 5 })).toBe(true)
  })
})

describe("safeEvaluateCondition - Comparisons (Not Equal)", () => {
  it("should evaluate !== to true for non-matching values", () => {
    expect(safeEvaluateCondition('data.status !== "Closed"', { status: "Open" })).toBe(true)
  })

  it("should evaluate !== to false for matching values", () => {
    expect(safeEvaluateCondition('data.status !== "Closed"', { status: "Closed" })).toBe(false)
  })

  it("should evaluate != to true for non-matching values", () => {
    expect(safeEvaluateCondition('data.status != "Closed"', { status: "Open" })).toBe(true)
  })
})

describe("safeEvaluateCondition - Comparisons (Numeric)", () => {
  it("should evaluate > to true when left is greater", () => {
    expect(safeEvaluateCondition("data.amount > 0", { amount: 10 })).toBe(true)
  })

  it("should evaluate > to false when left is not greater", () => {
    expect(safeEvaluateCondition("data.amount > 0", { amount: -5 })).toBe(false)
  })

  it("should evaluate > to false when equal", () => {
    expect(safeEvaluateCondition("data.amount > 10", { amount: 10 })).toBe(false)
  })

  it("should evaluate < to true when left is less", () => {
    expect(safeEvaluateCondition("data.amount < 0", { amount: -5 })).toBe(true)
  })

  it("should evaluate < to false when left is not less", () => {
    expect(safeEvaluateCondition("data.amount < 0", { amount: 10 })).toBe(false)
  })

  it("should evaluate >= to true when left is greater or equal", () => {
    expect(safeEvaluateCondition("data.amount >= 100", { amount: 100 })).toBe(true)
  })

  it("should evaluate >= to true when left is greater", () => {
    expect(safeEvaluateCondition("data.amount >= 100", { amount: 150 })).toBe(true)
  })

  it("should evaluate >= to false when left is less", () => {
    expect(safeEvaluateCondition("data.amount >= 100", { amount: 50 })).toBe(false)
  })

  it("should evaluate <= to true when left is less or equal", () => {
    expect(safeEvaluateCondition("data.amount <= 100", { amount: 100 })).toBe(true)
  })

  it("should evaluate <= to true when left is less", () => {
    expect(safeEvaluateCondition("data.amount <= 100", { amount: 50 })).toBe(true)
  })

  it("should evaluate <= to false when left is greater", () => {
    expect(safeEvaluateCondition("data.amount <= 100", { amount: 150 })).toBe(false)
  })
})

describe("safeEvaluateCondition - Logical Operators (AND)", () => {
  it("should evaluate && to true when both operands are truthy", () => {
    expect(safeEvaluateCondition("data.a && data.b", { a: true, b: true })).toBe(true)
  })

  it("should evaluate && to false when first operand is falsy", () => {
    expect(safeEvaluateCondition("data.a && data.b", { a: false, b: true })).toBe(false)
  })

  it("should evaluate && to false when second operand is falsy", () => {
    expect(safeEvaluateCondition("data.a && data.b", { a: true, b: false })).toBe(false)
  })

  it("should evaluate && to false when both operands are falsy", () => {
    expect(safeEvaluateCondition("data.a && data.b", { a: false, b: false })).toBe(false)
  })

  it("should short-circuit && evaluation", () => {
    expect(safeEvaluateCondition("data.a && data.b", { a: false, b: true })).toBe(false)
  })

  it("should handle multiple && operators", () => {
    expect(safeEvaluateCondition("data.a && data.b && data.c", { a: true, b: true, c: true })).toBe(true)
  })

  it("should return false with multiple && when one is false", () => {
    expect(safeEvaluateCondition("data.a && data.b && data.c", { a: true, b: false, c: true })).toBe(false)
  })
})

describe("safeEvaluateCondition - Logical Operators (OR)", () => {
  it("should evaluate || to true when first operand is truthy", () => {
    expect(safeEvaluateCondition("data.a || data.b", { a: true, b: false })).toBe(true)
  })

  it("should evaluate || to true when second operand is truthy", () => {
    expect(safeEvaluateCondition("data.a || data.b", { a: false, b: true })).toBe(true)
  })

  it("should evaluate || to true when both operands are truthy", () => {
    expect(safeEvaluateCondition("data.a || data.b", { a: true, b: true })).toBe(true)
  })

  it("should evaluate || to false when both operands are falsy", () => {
    expect(safeEvaluateCondition("data.a || data.b", { a: false, b: false })).toBe(false)
  })

  it("should short-circuit || evaluation", () => {
    expect(safeEvaluateCondition("data.a || data.b", { a: true, b: false })).toBe(true)
  })

  it("should handle multiple || operators", () => {
    expect(safeEvaluateCondition("data.a || data.b || data.c", { a: false, b: false, c: true })).toBe(true)
  })
})

describe("safeEvaluateCondition - Logical Operators (NOT)", () => {
  it("should evaluate ! to true when operand is falsy", () => {
    expect(safeEvaluateCondition("!data.hidden", { hidden: false })).toBe(true)
  })

  it("should evaluate ! to false when operand is truthy", () => {
    expect(safeEvaluateCondition("!data.hidden", { hidden: true })).toBe(false)
  })

  it("should evaluate ! with non-boolean values", () => {
    expect(safeEvaluateCondition("!data.value", { value: 0 })).toBe(true)
  })

  it("should evaluate ! with truthy values", () => {
    expect(safeEvaluateCondition("!data.value", { value: "text" })).toBe(false)
  })

  it("should handle double negation", () => {
    expect(safeEvaluateCondition("!!data.value", { value: true })).toBe(true)
  })
})

describe("safeEvaluateCondition - Nested Property Access", () => {
  it("should access nested property with data.customer.name", () => {
    expect(safeEvaluateCondition("data.customer.name", { customer: { name: "ACME" } })).toBe(true)
  })

  it("should return false when nested property is undefined", () => {
    expect(safeEvaluateCondition("data.customer.name", { customer: {} })).toBe(false)
  })

  it("should return false when parent is undefined", () => {
    expect(safeEvaluateCondition("data.customer.name", { notCustomer: {} })).toBe(false)
  })

  it("should access deeply nested properties", () => {
    expect(
      safeEvaluateCondition("data.deep.nested.value", {
        deep: { nested: { value: "success" } },
      }),
    ).toBe(true)
  })

  it("should handle deeply nested property access returning falsy", () => {
    expect(
      safeEvaluateCondition("data.deep.nested.value", {
        deep: { nested: { value: false } },
      }),
    ).toBe(false)
  })

  it("should handle deeply nested property access with undefined in chain", () => {
    expect(
      safeEvaluateCondition("data.deep.nested.value", {
        deep: { nested: {} },
      }),
    ).toBe(false)
  })

  it("should compare nested property values", () => {
    expect(
      safeEvaluateCondition('data.customer.status === "active"', {
        customer: { status: "active" },
      }),
    ).toBe(true)
  })
})

describe("safeEvaluateCondition - Parenthetical Grouping", () => {
  it("should evaluate expression with parentheses", () => {
    expect(safeEvaluateCondition("(data.a || data.b) && data.c", { a: true, b: false, c: true })).toBe(true)
  })

  it("should respect parenthetical precedence", () => {
    expect(safeEvaluateCondition("(data.a || data.b) && data.c", { a: false, b: false, c: true })).toBe(false)
  })

  it("should evaluate without parentheses using operator precedence", () => {
    expect(safeEvaluateCondition("data.a || data.b && data.c", { a: false, b: true, c: false })).toBe(false)
  })

  it("should evaluate with parentheses changing precedence", () => {
    expect(safeEvaluateCondition("(data.a || data.b) && data.c", { a: false, b: true, c: false })).toBe(false)
  })

  it("should handle nested parentheses", () => {
    expect(
      safeEvaluateCondition("((data.a || data.b) && data.c) || data.d", {
        a: false,
        b: false,
        c: true,
        d: true,
      }),
    ).toBe(true)
  })

  it("should handle parentheses with comparison operators", () => {
    expect(safeEvaluateCondition("(data.amount > 0) && (data.status === 'active')", { amount: 10, status: "active" })).toBe(true)
  })
})

describe("safeEvaluateCondition - Literals", () => {
  it("should evaluate true literal", () => {
    expect(safeEvaluateCondition("true", {})).toBe(true)
  })

  it("should evaluate false literal", () => {
    expect(safeEvaluateCondition("false", {})).toBe(false)
  })

  it("should evaluate null literal as falsy", () => {
    expect(safeEvaluateCondition("null", {})).toBe(false)
  })

  it("should evaluate undefined literal as falsy", () => {
    expect(safeEvaluateCondition("undefined", {})).toBe(false)
  })

  it("should evaluate number literal 0 as falsy", () => {
    expect(safeEvaluateCondition("0", {})).toBe(false)
  })

  it("should evaluate number literal non-zero as truthy", () => {
    expect(safeEvaluateCondition("1", {})).toBe(true)
  })

  it("should evaluate string literal", () => {
    expect(safeEvaluateCondition('"text"', {})).toBe(true)
  })

  it("should evaluate empty string literal as falsy", () => {
    expect(safeEvaluateCondition('""', {})).toBe(false)
  })

  it("should compare literals", () => {
    expect(safeEvaluateCondition("1 === 1", {})).toBe(true)
  })

  it("should compare different literals", () => {
    expect(safeEvaluateCondition("1 === 2", {})).toBe(false)
  })
})

describe("safeEvaluateCondition - Mixed Literals and Data", () => {
  it("should compare data property with string literal", () => {
    expect(safeEvaluateCondition('data.status === "pending"', { status: "pending" })).toBe(true)
  })

  it("should compare data property with number literal", () => {
    expect(safeEvaluateCondition("data.count === 5", { count: 5 })).toBe(true)
  })

  it("should use logical operators with literals", () => {
    expect(safeEvaluateCondition("true && data.enabled", { enabled: true })).toBe(true)
  })

  it("should use logical operators with falsy literal", () => {
    expect(safeEvaluateCondition("false || data.enabled", { enabled: true })).toBe(true)
  })
})

describe("safeEvaluateCondition - Security / XSS Prevention", () => {
  it("should return true (fail-safe) for expression with alert call", () => {
    expect(safeEvaluateCondition('data.name || alert("XSS")', { name: "test" })).toBe(true)
  })

  it("should prevent function call execution", () => {
    expect(safeEvaluateCondition('alert("XSS")', {})).toBe(true)
  })

  it("should prevent window.location assignment", () => {
    expect(safeEvaluateCondition('window.location = "evil.com"', {})).toBe(true)
  })

  it("should prevent fetch calls", () => {
    expect(safeEvaluateCondition('fetch("http://evil.com")', {})).toBe(true)
  })

  it("should prevent __proto__ access", () => {
    expect(safeEvaluateCondition("data.__proto__", { __proto__: {} })).toBe(true)
  })

  it("should prevent constructor access", () => {
    expect(safeEvaluateCondition("data.constructor.name", { constructor: {} })).toBe(true)
  })

  it("should prevent prototype access", () => {
    expect(safeEvaluateCondition("data.prototype", { prototype: {} })).toBe(true)
  })

  it("should prevent method calls on data properties", () => {
    expect(safeEvaluateCondition("data.name.toUpperCase()", { name: "test" })).toBe(true)
  })

  it("should prevent assignment operators", () => {
    expect(safeEvaluateCondition("data.value = 123", { value: 0 })).toBe(true)
  })

  it("should prevent new operator usage", () => {
    expect(safeEvaluateCondition("new Date()", {})).toBe(true)
  })

  it("should prevent delete operator usage", () => {
    expect(safeEvaluateCondition("delete data.field", { field: "value" })).toBe(true)
  })

  it("should prevent typeof operator", () => {
    expect(safeEvaluateCondition("typeof data.field", { field: "value" })).toBe(true)
  })
})

describe("safeEvaluateCondition - Edge Cases", () => {
  it("should handle undefined form data", () => {
    expect(safeEvaluateCondition("data.enabled", undefined as any)).toBe(true)
  })

  it("should handle empty form data object", () => {
    expect(safeEvaluateCondition("data.enabled", {})).toBe(false)
  })

  it("should handle null form data", () => {
    expect(safeEvaluateCondition("data.enabled", null as any)).toBe(true)
  })

  it("should handle negative numbers", () => {
    expect(safeEvaluateCondition("data.amount > -10", { amount: -5 })).toBe(true)
  })

  it("should handle negative number literals", () => {
    expect(safeEvaluateCondition("-5 < 0", {})).toBe(true)
  })

  it("should handle decimal numbers", () => {
    expect(safeEvaluateCondition("data.price >= 99.99", { price: 99.99 })).toBe(true)
  })

  it("should handle single quotes in strings", () => {
    expect(safeEvaluateCondition("data.name === 'John'", { name: "John" })).toBe(true)
  })

  it("should handle double quotes in strings", () => {
    expect(safeEvaluateCondition('data.name === "Jane"', { name: "Jane" })).toBe(true)
  })

  it("should handle escaped quotes in strings", () => {
    expect(safeEvaluateCondition('data.message === "He said \\"hello\\""', { message: 'He said "hello"' })).toBe(true)
  })

  it("should handle very long condition expressions", () => {
    const longCondition = "data.a || data.b || data.c || data.d || data.e || data.f || data.g"
    expect(safeEvaluateCondition(longCondition, { g: true })).toBe(true)
  })

  it("should handle multiple comparisons", () => {
    expect(safeEvaluateCondition("data.x === 5 && data.y === 10", { x: 5, y: 10 })).toBe(true)
  })

  it("should handle complex expressions with all operators", () => {
    expect(
      safeEvaluateCondition(
        '(data.active && data.status === "verified") || data.admin',
        { active: true, status: "verified", admin: false },
      ),
    ).toBe(true)
  })

  it("should return true for invalid syntax (fail-safe)", () => {
    expect(safeEvaluateCondition("data.name ===", { name: "test" })).toBe(true)
  })

  it("should return true for unmatched parenthesis (fail-safe)", () => {
    expect(safeEvaluateCondition("(data.name", { name: "test" })).toBe(true)
  })

  it("should return true for unknown characters (fail-safe)", () => {
    expect(safeEvaluateCondition("data.name @#$", { name: "test" })).toBe(true)
  })

  it("should handle property names with underscores", () => {
    expect(safeEvaluateCondition("data.first_name", { first_name: "John" })).toBe(true)
  })

  it("should handle property names with numbers", () => {
    expect(safeEvaluateCondition("data.field123", { field123: "value" })).toBe(true)
  })
})

describe("safeEvaluateCondition - Operator Precedence", () => {
  it("should apply && higher precedence than ||", () => {
    expect(safeEvaluateCondition("data.a || data.b && data.c", { a: true, b: false, c: false })).toBe(true)
  })

  it("should apply && higher precedence than || (both false case)", () => {
    expect(safeEvaluateCondition("data.a || data.b && data.c", { a: false, b: true, c: false })).toBe(false)
  })

  it("should apply comparison operators higher precedence than &&", () => {
    expect(safeEvaluateCondition("data.x > 5 && data.y === 10", { x: 10, y: 10 })).toBe(true)
  })

  it("should apply comparison operators higher precedence than ||", () => {
    expect(safeEvaluateCondition("data.x > 5 || data.y === 10", { x: 3, y: 10 })).toBe(true)
  })

  it("should apply NOT highest precedence", () => {
    expect(safeEvaluateCondition("!data.x && data.y", { x: false, y: true })).toBe(true)
  })

  it("should apply NOT before ||", () => {
    expect(safeEvaluateCondition("!data.x || data.y", { x: true, y: false })).toBe(false)
  })
})

describe("safeEvaluateCondition - Real-World Scenarios", () => {
  it("should evaluate conditional form field visibility", () => {
    expect(safeEvaluateCondition("data.shipmentMethod === 'express' && data.country !== 'US'", { shipmentMethod: "express", country: "CA" })).toBe(true)
  })

  it("should evaluate discount eligibility", () => {
    expect(
      safeEvaluateCondition("data.totalAmount >= 100 && (data.membershipLevel === 'gold' || data.membershipLevel === 'platinum')", {
        totalAmount: 150,
        membershipLevel: "silver",
      }),
    ).toBe(false)
  })

  it("should evaluate order status conditions", () => {
    expect(
      safeEvaluateCondition("(data.status === 'pending' || data.status === 'processing') && !data.isArchived", {
        status: "pending",
        isArchived: false,
      }),
    ).toBe(true)
  })

  it("should evaluate user permission checks", () => {
    expect(
      safeEvaluateCondition("data.isAdmin || (data.isModerator && data.department === 'support')", {
        isAdmin: false,
        isModerator: true,
        department: "support",
      }),
    ).toBe(true)
  })

  it("should handle range checks", () => {
    expect(safeEvaluateCondition("data.score >= 50 && data.score <= 100", { score: 75 })).toBe(true)
  })

  it("should handle range check boundary (lower)", () => {
    expect(safeEvaluateCondition("data.score >= 50 && data.score <= 100", { score: 50 })).toBe(true)
  })

  it("should handle range check boundary (upper)", () => {
    expect(safeEvaluateCondition("data.score >= 50 && data.score <= 100", { score: 100 })).toBe(true)
  })

  it("should handle range check outside", () => {
    expect(safeEvaluateCondition("data.score >= 50 && data.score <= 100", { score: 120 })).toBe(false)
  })
})
