// NCE Studio — Type Definitions
// All shared TypeScript interfaces for the NCE extension

// --- Edit Lock ---
export interface EditLock {
  locked: boolean
  locked_by?: string
  locked_at?: string
  expires_at?: string
}

// --- Field Resolution ---
export interface ResolvedFields {
  [fieldPath: string]: any
}

export interface FieldValue {
  [fieldPath: string]: any
}

export interface SaveResult {
  status: "ok" | "conflict"
  updated_docs?: Array<{ doctype: string; docname: string }>
  message?: string
}

// --- Form Definition ---
export interface FormDefinition {
  name: string
  form_title: string
  target_doctype: string
  studio_page?: string
  form_schema: Record<string, any>
  field_mapping: Record<string, any>
  grid_layout: Record<string, any>
  grid_config: Record<string, any>
  tab_layout: TabDefinition[]

  on_load_script?: string
  on_submit_script?: string
  validation_rules?: Record<string, any>
  allowed_roles?: string[]
}

export interface TabDefinition {
  label: string
  fields: string[]
  condition?: string
}

// --- Field Metadata ---
export interface FieldMeta {
  fieldname: string
  fieldtype: string
  label: string
  options?: string
  reqd?: boolean
  read_only?: boolean
  hidden?: boolean
  default?: any
  description?: string
}

// --- PathFinder ---
export interface PathSegment {
  doctype: string
  fieldname: string
  fieldtype: string
  label: string
}

export interface FieldPath {
  segments: PathSegment[]
  dotNotation: string
  terminalField: FieldMeta
}

// --- Theme ---
export interface ThemeSettings {
  // Colours
  primary_color: string
  secondary_color: string
  accent_color: string
  success_color: string
  warning_color: string
  danger_color: string
  info_color: string
  gray_color: string
  text_color: string
  text_muted_color: string
  background_color: string
  surface_color: string
  border_color: string
  link_color: string
  focus_ring_color: string
  shadow_color: string
  // Typography
  font_family: string
  font_size_base: string
  font_weight_base: string
  line_height_base: string
  // Layout
  border_radius: string
  spacing_unit: string
  shadow_style: string
  max_content_width: string
  sidebar_width: string
  transition_speed: string
  // Custom
  custom_css: string
  tailwind_overrides: string
}

export interface ColorShade {
  step: number // 50, 100, 200, ... 900, 950
  hex: string
  oklch: [number, number, number] // L, C, H
}
