import { defineStore } from "pinia"
import { ref, computed } from "vue"
import type {
  FormDefinition,
  ResolvedFields,
  FieldValue,
  EditLock,
} from "@nce/types"
import {
  resolveFields,
  saveResolvedFields,
  acquireEditLock,
  releaseEditLock,
  getFormDefinition,
} from "@nce/utils/dataPipeline"
import { getFormFields } from "@nce/utils/schemaHelpers"

export const useNceFormStore = defineStore("nceForm", () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const formDefinition = ref<FormDefinition | null>(null)
  const currentDocname = ref<string | null>(null)
  const resolvedData = ref<ResolvedFields>({})
  const dirtyFields = ref<FieldValue>({})
  const editLock = ref<EditLock>({ locked: false })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const validationErrors = ref<Record<string, string>>({})

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const targetDoctype = computed(() => formDefinition.value?.target_doctype ?? "")
  const isDirty = computed(() => Object.keys(dirtyFields.value).length > 0)

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract all field paths referenced in the form definition.
   * Delegates to the canonical getFormFields() in schemaHelpers.
   */
  function _getFieldPaths(): string[] {
    const def = formDefinition.value
    if (!def) return []
    return getFormFields(def)
  }

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  /**
   * Load an NCE Form Definition by name.
   */
  async function loadForm(formName: string): Promise<void> {
    isLoading.value = true
    try {
      formDefinition.value = await getFormDefinition(formName)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a specific record and resolve all field paths from the schema.
   */
  async function loadRecord(docname: string): Promise<void> {
    if (!targetDoctype.value) return

    isLoading.value = true
    currentDocname.value = docname
    dirtyFields.value = {}
    validationErrors.value = {}

    try {
      const fieldPaths = _getFieldPaths()
      if (fieldPaths.length === 0) {
        resolvedData.value = {}
        return
      }

      resolvedData.value = await resolveFields(
        targetDoctype.value,
        docname,
        fieldPaths
      )
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Mark a single field as changed (dirty).
   */
  function setFieldValue(fieldPath: string, value: any): void {
    dirtyFields.value[fieldPath] = value
    // Clear any validation error for this field when user edits it
    if (validationErrors.value[fieldPath]) {
      delete validationErrors.value[fieldPath]
    }
  }

  /**
   * Read the current value of a field — dirty override wins over resolved.
   */
  function getFieldValue(fieldPath: string): any {
    if (fieldPath in dirtyFields.value) {
      return dirtyFields.value[fieldPath]
    }
    return resolvedData.value[fieldPath]
  }

  /**
   * Persist all dirty fields back to the server.
   */
  async function save(): Promise<boolean> {
    if (!targetDoctype.value || !currentDocname.value) return false
    if (!isDirty.value) return true

    if (!validate()) return false

    isSaving.value = true
    try {
      const result = await saveResolvedFields(
        targetDoctype.value,
        currentDocname.value,
        { ...dirtyFields.value },
        editLock.value.locked ? editLock.value.locked_by : undefined
      )

      if (result.status === "ok") {
        // Merge saved values into resolvedData and clear dirty
        Object.assign(resolvedData.value, dirtyFields.value)
        dirtyFields.value = {}
        return true
      }

      // Conflict — surface the message as a general validation error
      validationErrors.value["_save"] = result.message ?? "Save conflict"
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Acquire an edit lock for the current document.
   */
  async function acquireLock(): Promise<void> {
    if (!targetDoctype.value || !currentDocname.value) return
    editLock.value = await acquireEditLock(
      targetDoctype.value,
      currentDocname.value
    )
  }

  /**
   * Release the edit lock for the current document.
   */
  async function releaseLock(): Promise<void> {
    if (!targetDoctype.value || !currentDocname.value) return
    await releaseEditLock(targetDoctype.value, currentDocname.value)
    editLock.value = { locked: false }
  }

  /**
   * Extend the current lock by re-acquiring it.
   */
  async function refreshLock(): Promise<void> {
    if (!editLock.value.locked) return
    await acquireLock()
  }

  /**
   * Run validation rules against current field values.
   * Supports: required, minLength, maxLength, min, max, email, url, pattern.
   * Returns true if all validations pass.
   */
  function validate(): boolean {
    validationErrors.value = {}
    const def = formDefinition.value
    if (!def) return true

    if (def.validation_rules && typeof def.validation_rules === "object") {
      const rules = def.validation_rules as Record<string, any>
      for (const [fieldPath, rule] of Object.entries(rules)) {
        if (!rule || typeof rule !== "object") continue

        const value = getFieldValue(fieldPath)
        const label = rule.label ?? fieldPath

        // Skip further checks if value is empty and field is not required
        const isEmpty = value === null || value === undefined || value === ""
        if (isEmpty && !rule.required) continue

        // Already has an error from a previous rule — skip
        if (validationErrors.value[fieldPath]) continue

        // Required
        if (rule.required && isEmpty) {
          validationErrors.value[fieldPath] = `${label} is required`
          continue
        }

        // String length checks
        if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
          validationErrors.value[fieldPath] =
            `${label} must be at least ${rule.minLength} characters`
        }
        if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
          validationErrors.value[fieldPath] =
            `${label} must be at most ${rule.maxLength} characters`
        }

        // Numeric range checks
        if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
          validationErrors.value[fieldPath] =
            `${label} must be at least ${rule.min}`
        }
        if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
          validationErrors.value[fieldPath] =
            `${label} must be at most ${rule.max}`
        }

        // Email format
        if (rule.email && typeof value === "string" && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            validationErrors.value[fieldPath] = `${label} must be a valid email address`
          }
        }

        // URL format
        if (rule.url && typeof value === "string" && value) {
          try {
            new URL(value)
          } catch {
            validationErrors.value[fieldPath] = `${label} must be a valid URL`
          }
        }

        // Regex pattern
        if (rule.pattern && typeof value === "string" && value) {
          try {
            const regex = new RegExp(rule.pattern)
            if (!regex.test(value)) {
              validationErrors.value[fieldPath] =
                rule.patternMessage ?? `${label} does not match the required format`
            }
          } catch {
            // Invalid regex pattern in config — skip
          }
        }
      }
    }

    return Object.keys(validationErrors.value).length === 0
  }

  /**
   * Discard all unsaved changes and clear validation errors.
   */
  function reset(): void {
    dirtyFields.value = {}
    validationErrors.value = {}
  }

  /**
   * Return a merged snapshot of resolved + dirty data.
   */
  function getFormData(): ResolvedFields {
    return { ...resolvedData.value, ...dirtyFields.value }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    // State
    formDefinition,
    currentDocname,
    resolvedData,
    dirtyFields,
    editLock,
    isLoading,
    isSaving,
    validationErrors,

    // Computed
    targetDoctype,
    isDirty,

    // Methods
    loadForm,
    loadRecord,
    setFieldValue,
    getFieldValue,
    save,
    acquireLock,
    releaseLock,
    refreshLock,
    validate,
    reset,
    getFormData,
  }
})
