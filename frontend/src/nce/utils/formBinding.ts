// NCE Studio — PathFinder ↔ Form Field Binding Utilities
// Provides utilities for binding PathFinder selections to form fields

import type { FieldMeta, FormDefinition } from "@nce/types"

/**
 * Validates a field path against the form's target DocType structure.
 * Checks if the path resolves to valid fields in the target doctype.
 */
export function validateFieldPath(
  path: string,
  targetDoctype: string
): { valid: boolean; error?: string } {
  if (!path || path.trim() === "") {
    return { valid: false, error: "Path cannot be empty" }
  }

  // Basic path validation - ensure it contains only valid characters
  const pathRegex = /^[a-zA-Z0-9_.]+$/
  if (!pathRegex.test(path)) {
    return { valid: false, error: "Path contains invalid characters" }
  }

  // Basic segment validation
  const segments = path.split(".")
  for (const segment of segments) {
    // Field names cannot start with a number
    if (/^\d/.test(segment)) {
      return { valid: false, error: `Field name '${segment}' cannot start with a number` }
    }
    // Field names cannot be empty
    if (segment.trim() === "") {
      return { valid: false, error: "Path contains empty segments" }
    }
  }

  return { valid: true }
}

/**
 * Binds a PathFinder selection to a form field configuration.
 * Returns a complete field configuration object with resolved path information.
 */
export function bindPathFinderToField(
  fieldPath: string,
  targetDoctype: string
): {
  fieldPath: string
  resolvedPath: string[]
  isValid: boolean
  errorMessage?: string
} {
  const validation = validateFieldPath(fieldPath, targetDoctype)

  if (!validation.valid) {
    return {
      fieldPath,
      resolvedPath: [],
      isValid: false,
      errorMessage: validation.error,
    }
  }

  const resolvedPath = fieldPath.split(".")

  return {
    fieldPath,
    resolvedPath,
    isValid: true,
  }
}

/**
 * Creates a form field configuration from a PathFinder selection.
 * This is used when adding a new field via PathFinder in the form editor.
 */
export function createFieldFromPath(
  path: string,
  label?: string,
  fieldtype: string = "Data"
): {
  id: string
  label: string
  fieldtype: string
  bindPath: string
  options?: string
} {
  // Generate a unique ID based on the path (sanitized)
  const id = path
    .replace(/\./g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase()

  // Derive field label from the last segment of the path
  const segments = path.split(".")
  const fieldName = segments[segments.length - 1]
  const fieldLabel = label || fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    id,
    label: fieldLabel,
    fieldtype,
    bindPath: path,
  }
}

/**
 * Extracts the terminal field name from a dotted path.
 * Example: "customer.address.line1" → "line1"
 */
export function getTerminalFieldName(path: string): string {
  const segments = path.split(".")
  return segments[segments.length - 1]
}

/**
 * Extracts the parent path from a dotted path.
 * Example: "customer.address.line1" → "customer.address"
 */
export function getParentPath(path: string): string {
  const segments = path.split(".")
  segments.pop()
  return segments.join(".")
}

/**
 * Checks if a path is a direct field (no dots) or a nested path.
 */
export function isDirectField(path: string): boolean {
  return !path.includes(".")
}

/**
 * Generates a display-friendly version of a field path.
 * Example: "customer.address.city" → "Customer → Address → City"
 */
export function formatPathForDisplay(path: string, doctypeLabels?: Record<string, string>): string {
  const segments = path.split(".")

  if (segments.length === 1) {
    return segments[0]
  }

  // For now, just replace dots with arrows
  // In a full implementation, you would look up actual labels from the DocType
  return segments.join(" → ")
}

/**
 * Validates that a field path exists in the form's field_mapping.
 * Returns true if the path is properly mapped.
 */
export function isPathMapped(
  path: string,
  fieldMapping: Record<string, any>
): boolean {
  return Object.values(fieldMapping).includes(path)
}

/**
 * Finds all field paths in a form definition that match a pattern.
 * Useful for finding all fields that reference a particular linked document.
 */
export function findPathMatches(
  formDefinition: FormDefinition,
  pattern: string
): string[] {
  const matches: string[] = []
  const fieldMapping = formDefinition.field_mapping || {}
  const validationRules = formDefinition.validation_rules || {}

  // Check field_mapping
  for (const [key, value] of Object.entries(fieldMapping)) {
    if (typeof value === "string" && value.includes(pattern)) {
      matches.push(value)
    }
  }

  // Check validation_rules paths
  for (const fieldPath of Object.keys(validationRules)) {
    if (fieldPath.includes(pattern)) {
      matches.push(fieldPath)
    }
  }

  return [...new Set(matches)] // Remove duplicates
}

/**
 * Updates a form definition with a new field binding.
 * Adds the field to field_mapping with an auto-generated ID.
 */
export function addFieldBinding(
  formDefinition: FormDefinition,
  fieldPath: string,
  fieldLabel: string,
  fieldtype: string = "Data"
): FormDefinition {
  // Generate a unique ID for the field
  const existingIds = new Set(Object.keys(formDefinition.field_mapping || {}))
  let id = fieldPath.replace(/\./g, "_").toLowerCase()
  let counter = 1

  while (existingIds.has(id)) {
    id = `${id}_${counter}`
    counter++
  }

  // Update field_mapping
  const newFieldMapping = {
    ...(formDefinition.field_mapping || {}),
    [id]: fieldPath,
  }

  return {
    ...formDefinition,
    field_mapping: newFieldMapping,
  }
}
