# NCE Studio — Implementation Plan

> **Step-by-step coding plan for integrating five NCE capabilities + theme system into the Frappe Studio fork.**
>
> Generated: 2026-03-23 | Based on: NCE-Builder-Element-Catalogue.docx + Frappe Studio Technical Reference

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependency Graph](#dependency-graph)
3. [Phase 0 — Fork Setup & Scaffolding](#phase-0--fork-setup--scaffolding)
4. [Phase 1 — Backend: DocTypes & API Endpoints](#phase-1--backend-doctypes--api-endpoints)
5. [Phase 2 — Frontend: Data Pipeline & Stores](#phase-2--frontend-data-pipeline--stores)
6. [Phase 3 — Frontend: PathFinder Panel](#phase-3--frontend-pathfinder-panel)
7. [Phase 4 — Frontend: Form-Aware Components](#phase-4--frontend-form-aware-components)
8. [Phase 5 — Frontend: Form Runtime](#phase-5--frontend-form-runtime)
9. [Phase 6 — Theme System](#phase-6--theme-system)
10. [Phase 7 — Integration, Wiring & Polish](#phase-7--integration-wiring--polish)
11. [Phase 8 — Testing & Validation](#phase-8--testing--validation)
12. [File Index](#file-index)

---

## Architecture Overview

NCE Studio = Frappe Studio (unchanged) + 5 capabilities + theme system.

```text
┌──────────────────────────────────────────────────────────────────┐
│  FRAPPE STUDIO (kept as-is)                                      │
│  Canvas · Drag-Drop · Component Palette · Block Tree · Stores    │
│  StudioApp / StudioPage DocTypes · AppRenderer · Build System    │
├──────────────────────────────────────────────────────────────────┤
│  NCE EXTENSIONS (new code)                                       │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ PathFinder   │  │ Form-Aware   │  │ Theme System            │ │
│  │ Panel        │  │ Components   │  │ OKLCH Engine · Settings │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────┘ │
│         │                 │                        │              │
│  ┌──────┴─────────────────┴────────────────────────┴────────────┐│
│  │              NCE Data Pipeline (stores + API)                 ││
│  │  resolve_fields · save_resolved_fields · edit locking         ││
│  └──────────────────────────┬────────────────────────────────────┘│
│                             │                                     │
├─────────────────────────────┴─────────────────────────────────────┤
│  FRAPPE FRAMEWORK (DocTypes · ORM · Permissions · Hooks)          │
│  NCE Form Definition · NCE Edit Lock · NCE Theme Settings         │
└───────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **No modification of Studio's core files unless absolutely necessary.** Prefer extension over mutation.
2. **The 6 Studio files explicitly listed for extension** (`components.ts`, `studioStore.ts`, `canvasStore.ts`, `codeStore.ts`, `StudioLeftPanel.vue`, `ComponentProperties.vue`, `block.ts`, `studio_router.ts`, `api.py`, `hooks.py`) are the *only* Studio files we modify, and modifications are additive (new imports, new entries, new tabs — not rewrites).
3. **NCE code lives in clearly namespaced directories**: `nce/` under `frontend/src/` and `studio/` under `studio/`.
4. **Backend before frontend.** DocTypes and API endpoints are implemented first so the frontend has real data to work with from day one.

---

## Dependency Graph

```text
Phase 0: Fork Setup
    │
    ▼
Phase 1: Backend DocTypes + API ──────────────────────────┐
    │                                                      │
    ▼                                                      ▼
Phase 2: Data Pipeline Stores              Phase 6: Theme System (backend)
    │                                                      │
    ├──────────────┐                                       │
    ▼              ▼                                       ▼
Phase 3:       Phase 4:                    Phase 6 contd: Theme System (frontend)
PathFinder     Form Components                             │
    │              │                                       │
    └──────┬───────┘                                       │
           ▼                                               │
    Phase 5: Form Runtime                                  │
           │                                               │
           └───────────────┬───────────────────────────────┘
                           ▼
                    Phase 7: Integration & Polish
                           │
                           ▼
                    Phase 8: Testing
```

---

## Phase 0 — Fork Setup & Scaffolding

**Goal:** Establish the NCE directory structure inside the Frappe Studio fork so all subsequent phases have a clean home.

### Step 0.1 — Create NCE frontend directory structure

**Files to create:**

| Path | Purpose |
|------|---------|
| `frontend/src/nce/` | Root for all NCE frontend code |
| `frontend/src/nce/components/` | NCE Vue components |
| `frontend/src/nce/components/PathFinder/` | PathFinder panel components |
| `frontend/src/nce/components/FormElements/` | Form-aware Studio component renderers |
| `frontend/src/nce/components/Theme/` | Theme editor UI components |
| `frontend/src/nce/stores/` | NCE Pinia stores |
| `frontend/src/nce/utils/` | NCE utility modules |
| `frontend/src/nce/types/` | NCE TypeScript type definitions |
| `frontend/src/nce/pages/` | NCE route-level page components |

**Action:** Create each directory with a placeholder `index.ts` barrel export file.

### Step 0.2 — Create NCE backend directory structure

**Files to create:**

| Path | Purpose |
|------|---------|
| `studio/studio/` | Python package root for NCE backend |
| `studio/studio/__init__.py` | Package init |
| `studio/studio/doctype/` | NCE DocTypes directory |
| `studio/studio/doctype/__init__.py` | |
| `studio/studio/api.py` | NCE API endpoints (separate from Studio's) |

**Action:** Create directories and `__init__.py` files.

### Step 0.3 — Register NCE module with Frappe

**File to modify:** `studio/modules.txt`

**Change:** Append `NCE Studio` as a second module line:

```text
Studio
NCE Studio
```

### Step 0.4 — Update Vite aliases (if needed)

**File to modify:** `frontend/vite.config.js`

**Change:** Add a path alias so `@nce/` resolves to `src/nce/`:

```js
resolve: {
  alias: {
    '@nce': path.resolve(__dirname, 'src/nce'),
    // ... existing aliases
  }
}
```

### Step 0.5 — Update Tailwind content paths

**File to modify:** `frontend/tailwind.config.js`

**Change:** Ensure `'./src/nce/**/*.{vue,ts}'` is included in the `content` array so Tailwind purges NCE classes correctly.

---

## Phase 1 — Backend: DocTypes & API Endpoints

**Goal:** Create the three NCE DocTypes and all API endpoints so the frontend has a working backend from the start.

**Dependencies:** Phase 0 complete.

---

### Step 1.1 — NCE Form Definition DocType

**Files to create:**

| Path | Purpose |
|------|---------|
| `studio/studio/doctype/nce_form_definition/__init__.py` | |
| `studio/studio/doctype/nce_form_definition/nce_form_definition.json` | DocType schema |
| `studio/studio/doctype/nce_form_definition/nce_form_definition.py` | Controller |

**DocType schema (`nce_form_definition.json`):**

```json
{
  "doctype": "DocType",
  "name": "NCE Form Definition",
  "module": "NCE Studio",
  "naming_rule": "Expression",
  "autoname": "format:NCE-FORM-{#####}",
  "fields": [
    { "fieldname": "form_title",       "fieldtype": "Data",        "label": "Form Title",        "reqd": 1, "in_list_view": 1 },
    { "fieldname": "target_doctype",   "fieldtype": "Link",        "label": "Target DocType",    "options": "DocType", "reqd": 1, "in_list_view": 1 },
    { "fieldname": "studio_page",      "fieldtype": "Link",        "label": "Studio Page",       "options": "Studio Page" },
    { "fieldname": "form_schema",      "fieldtype": "JSON",        "label": "Form Schema" },
    { "fieldname": "field_mapping",    "fieldtype": "JSON",        "label": "Field Mapping" },
    { "fieldname": "grid_layout",      "fieldtype": "JSON",        "label": "Grid Layout" },
    { "fieldname": "grid_config",      "fieldtype": "JSON",        "label": "Grid Configuration" },
    { "fieldname": "tab_layout",       "fieldtype": "JSON",        "label": "Tab Layout" },
    { "fieldname": "section_submission","fieldtype": "Section Break","label": "Submission" },
    { "fieldname": "submission_action","fieldtype": "Select",      "label": "Submission Action",  "options": "Save\nSubmit\nWorkflow\nCustom API", "default": "Save" },
    { "fieldname": "custom_api_endpoint","fieldtype": "Data",      "label": "Custom API Endpoint" },
    { "fieldname": "section_scripts",  "fieldtype": "Section Break","label": "Scripts" },
    { "fieldname": "on_load_script",   "fieldtype": "Code",        "label": "On Load Script",    "options": "JavaScript" },
    { "fieldname": "on_submit_script", "fieldtype": "Code",        "label": "On Submit Script",  "options": "JavaScript" },
    { "fieldname": "validation_rules",  "fieldtype": "JSON",        "label": "Validation Rules" },
    { "fieldname": "section_access",   "fieldtype": "Section Break","label": "Access Control" },
    { "fieldname": "allowed_roles",    "fieldtype": "JSON",        "label": "Allowed Roles" }
  ],
  "permissions": [
    { "role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1 }
  ],
  "sort_field": "creation",
  "sort_order": "DESC",
  "track_changes": 1
}
```

**Controller (`nce_form_definition.py`):**

- `validate()` — ensure `target_doctype` exists, parse and validate `form_schema` JSON structure
- `get_resolved_schema()` — whitelisted method that returns the schema merged with DocType field metadata (field types, options, labels) from `frappe.get_meta(self.target_doctype)`

---

### Step 1.2 — NCE Edit Lock DocType

**Files to create:**

| Path | Purpose |
|------|---------|
| `studio/studio/doctype/nce_edit_lock/__init__.py` | |
| `studio/studio/doctype/nce_edit_lock/nce_edit_lock.json` | DocType schema |
| `studio/studio/doctype/nce_edit_lock/nce_edit_lock.py` | Controller |

**DocType schema (`nce_edit_lock.json`):**

```json
{
  "doctype": "DocType",
  "name": "NCE Edit Lock",
  "module": "NCE Studio",
  "naming_rule": "Expression",
  "autoname": "format:{target_doctype}:{target_docname}",
  "fields": [
    { "fieldname": "target_doctype",  "fieldtype": "Link",     "label": "Target DocType",  "options": "DocType", "reqd": 1, "in_list_view": 1 },
    { "fieldname": "target_docname",  "fieldtype": "Data",     "label": "Target Document", "reqd": 1, "in_list_view": 1 },
    { "fieldname": "locked_by",       "fieldtype": "Link",     "label": "Locked By",       "options": "User", "in_list_view": 1 },
    { "fieldname": "locked_at",       "fieldtype": "Datetime", "label": "Locked At" },
    { "fieldname": "expires_at",      "fieldtype": "Datetime", "label": "Expires At" }
  ],
  "permissions": [
    { "role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1 }
  ],
  "sort_field": "creation",
  "sort_order": "DESC"
}
```

**Controller (`nce_edit_lock.py`):**

- `validate()` — ensure lock has not expired, ensure `locked_by` matches session user or is empty
- `is_expired()` — helper comparing `expires_at` to `frappe.utils.now_datetime()`
- `release()` — clears `locked_by`, `locked_at`, `expires_at`

---

### Step 1.3 — NCE Theme Settings DocType

**Files to create:**

| Path | Purpose |
|------|---------|
| `studio/studio/doctype/nce_theme_settings/__init__.py` | |
| `studio/studio/doctype/nce_theme_settings/nce_theme_settings.json` | DocType schema (Single) |
| `studio/studio/doctype/nce_theme_settings/nce_theme_settings.py` | Controller |

**DocType schema (`nce_theme_settings.json`):**

This is a **Single DocType** (`issingle: 1`).

Key field groups:
- **Colours** (16 fields): `primary_color`, `secondary_color`, `accent_color`, `success_color`, `warning_color`, `danger_color`, `info_color`, `gray_color`, `text_color`, `text_muted_color`, `background_color`, `surface_color`, `border_color`, `link_color`, `focus_ring_color`, `shadow_color`
- **Typography** (4 fields): `font_family`, `font_size_base`, `font_weight_base`, `line_height_base`
- **Layout** (6 fields): `border_radius`, `spacing_unit`, `shadow_style`, `max_content_width`, `sidebar_width`, `transition_speed`
- **Custom** (2 fields): `custom_css` (Code/CSS), `tailwind_overrides` (Code/JSON)

**Controller (`nce_theme_settings.py`):**

- `on_update()` — triggers CSS regeneration by calling `regenerate_theme_css()`
- `regenerate_theme_css()` — reads all colour fields → generates OKLCH shade scales (Python port or calls the TS engine via a build step) → writes `/assets/studio/css/nce_theme.css` → clears cache
- `get_theme_variables()` — whitelisted, returns a dict of all theme fields for the frontend

---

### Step 1.4 — NCE API Endpoints

**File to create:** `studio/studio/api.py`

This file contains all five capability endpoints plus the theme endpoint. Each is `@frappe.whitelist()`.

#### 1.4.1 — `resolve_fields(doctype, docname, field_paths)`

**Purpose:** Read data through link chains.

**Algorithm:**
1. Accept `doctype` (str), `docname` (str), `field_paths` (list of dot-notation strings)
2. For each `field_path`:
   - Split on `.` → segments
   - Walk segments: for each intermediate segment, check if it's a Link field on the current DocType, fetch the linked document, cache it, advance
   - Final segment: read the field value from the terminal document
3. Return `{ "field_path": resolved_value, ... }`
4. Use `frappe.get_cached_doc()` for intermediate documents
5. Permission check: `frappe.has_permission(doctype, "read", docname)` at the root level; intermediate reads use `ignore_permissions=False` on `frappe.get_doc()`

**Key implementation details:**
- Cache: `doc_cache = {}` keyed by `(doctype, docname)` within the request
- Handle `None` gracefully at any point in the chain (link field is empty → return `None` for that path)
- Support Table fields: if a segment resolves to a child table, return a list of resolved values

#### 1.4.2 — `save_resolved_fields(doctype, docname, field_values, lock_token=None)`

**Purpose:** Write changed data back through link chains.

**Algorithm:**
1. Accept `doctype`, `docname`, `field_values` (dict of `field_path → new_value`), optional `lock_token`
2. If `lock_token` provided, validate the edit lock (call `check_edit_lock` internally)
3. Group `field_values` by their target document (walk each path to find which intermediate doc owns the final field)
4. For each target document:
   - `frappe.get_doc(target_doctype, target_docname)`
   - Set each field value
   - `doc.save()`
5. Return `{ "status": "ok", "updated_docs": [...] }` or `{ "status": "conflict", "message": "..." }`

#### 1.4.3 — `check_edit_lock(doctype, docname)`

**Purpose:** Check if a record is currently locked.

**Algorithm:**
1. Look up `NCE Edit Lock` by `target_doctype` + `target_docname`
2. If no lock exists or lock is expired → return `{ "locked": false }`
3. If lock exists and not expired → return `{ "locked": true, "locked_by": ..., "locked_at": ..., "expires_at": ... }`

#### 1.4.4 — `acquire_edit_lock(doctype, docname, duration_minutes=15)`

**Purpose:** Acquire an edit lock for the current user.

**Algorithm:**
1. Check existing lock via `check_edit_lock()`
2. If locked by another user → raise/return conflict
3. If not locked or locked by same user → upsert `NCE Edit Lock` with `locked_by=frappe.session.user`, `locked_at=now()`, `expires_at=now()+duration_minutes`
4. Return `{ "locked": true, "locked_by": ..., "expires_at": ... }`

#### 1.4.5 — `release_edit_lock(doctype, docname)`

**Purpose:** Release the current user's lock.

**Algorithm:**
1. Find `NCE Edit Lock` by target
2. If `locked_by == frappe.session.user` → delete or clear the lock
3. Return `{ "released": true }`

#### 1.4.6 — `get_random_doc_name(doctype)`

**Purpose:** Return a random document name for a given DocType (used by form runtime for record selection/preview).

**Algorithm:**
1. `frappe.has_permission(doctype, "read", throw=True)`
2. `names = frappe.get_all(doctype, pluck="name", limit_page_length=100, order_by="creation desc")`
3. Return `random.choice(names)` if names else `None`

#### 1.4.7 — `regenerate_theme_css()`

**Purpose:** Regenerate the site-wide NCE theme CSS file from current settings.

**Algorithm:**
1. Load `NCE Theme Settings` singleton
2. For each colour field: generate 11 OKLCH shade steps (50–950)
3. Build CSS variable declarations (`:root { --nce-primary-50: ...; ... }`)
4. Include typography and layout variables
5. Append `custom_css` field content
6. Write to `{bench_path}/sites/{site}/public/files/nce_theme.css`
7. Clear Frappe cache

---

### Step 1.5 — Register NCE API and hooks

**File to modify:** `studio/hooks.py`

**Changes (additive only):**

```python
# --- NCE Studio Extensions ---

# Include NCE theme CSS on every Desk page
app_include_css = "/files/nce_theme.css"

# NCE document events
doc_events = {
    "NCE Theme Settings": {
        "on_update": "studio.studio.api.regenerate_theme_css"
    }
}

# Website route for NCE form runtime
website_route_rules = [
    # ... existing Studio routes ...
    {"from_route": "/nce-form/<path:form_path>", "to_route": "nce_form"},
]
```

**File to modify:** `studio/patches.txt`

**Change:** (No patches needed yet — clean install. Add section header for future NCE patches.)

```text
[post_model_sync]
# ... existing Studio patches ...

# NCE Studio patches
# studio.patches.v1_0.example_patch
```

---

## Phase 2 — Frontend: Data Pipeline & Stores

**Goal:** Create the Pinia stores and TypeScript utilities that the frontend uses to call the NCE API endpoints.

**Dependencies:** Phase 1 complete (API endpoints exist).

---

### Step 2.1 — NCE TypeScript types

**File to create:** `frontend/src/nce/types/index.ts`

**Contents:**

```typescript
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
  status: 'ok' | 'conflict'
  updated_docs?: string[]
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
  submission_action: 'Save' | 'Submit' | 'Workflow' | 'Custom API'
  custom_api_endpoint?: string
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
  step: number     // 50, 100, 200, ... 900, 950
  hex: string
  oklch: [number, number, number]  // L, C, H
}
```

---

### Step 2.2 — NCE Form Store

**File to create:** `frontend/src/nce/stores/nceFormStore.ts`

**Purpose:** Manages the lifecycle of an NCE form — loading the definition, resolving field data, tracking dirty fields, handling submission.

**Key state:**

| Field | Type | Purpose |
|-------|------|---------|
| `formDefinition` | `ref<FormDefinition \| null>` | The loaded NCE Form Definition |
| `targetDoctype` | `computed<string>` | Shortcut to `formDefinition.target_doctype` |
| `currentDocname` | `ref<string \| null>` | The document currently being edited |
| `resolvedData` | `ref<ResolvedFields>` | Current field values (resolved from server) |
| `dirtyFields` | `ref<FieldValue>` | Fields changed by the user (not yet saved) |
| `editLock` | `ref<EditLock>` | Current lock status |
| `isLoading` | `ref<boolean>` | Loading indicator |
| `isSaving` | `ref<boolean>` | Saving indicator |
| `validationErrors` | `ref<Record<string, string>>` | Per-field error messages |

**Key methods:**

| Method | Purpose |
|--------|---------|
| `loadForm(formName)` | Fetch `NCE Form Definition` via `frappe.call`, populate `formDefinition` |
| `loadRecord(docname)` | Call `resolve_fields()` API with all field paths from the schema, populate `resolvedData` |
| `setFieldValue(fieldPath, value)` | Update `dirtyFields[fieldPath] = value` |
| `getFieldValue(fieldPath)` | Return `dirtyFields[fieldPath] ?? resolvedData[fieldPath]` |
| `save()` | Call `save_resolved_fields()` with `dirtyFields`, clear dirty on success |
| `acquireLock()` | Call `acquire_edit_lock()`, update `editLock` |
| `releaseLock()` | Call `release_edit_lock()`, clear `editLock` |
| `refreshLock()` | Re-acquire to extend expiry (call on interval) |
| `validate()` | Run `validation_rules` against current values, populate `validationErrors` |
| `reset()` | Clear `dirtyFields`, re-resolve from server |
| `getFormData()` | Return merged `resolvedData` + `dirtyFields` |

---

### Step 2.3 — NCE Edit Lock Store

**File to create:** `frontend/src/nce/stores/nceEditLockStore.ts`

**Purpose:** Thin wrapper around the edit lock API. Used by `nceFormStore` but also available standalone (e.g. for any future record-editing UI).

**Key methods:**

| Method | Calls |
|--------|-------|
| `check(doctype, docname)` | `studio.api.check_edit_lock` |
| `acquire(doctype, docname, duration?)` | `studio.api.acquire_edit_lock` |
| `release(doctype, docname)` | `studio.api.release_edit_lock` |
| `startAutoRefresh(doctype, docname, intervalMs)` | Sets up `setInterval` to re-acquire before expiry |
| `stopAutoRefresh()` | Clears the interval |

---

### Step 2.4 — NCE Data Pipeline Utilities

**File to create:** `frontend/src/nce/utils/dataPipeline.ts`

**Purpose:** Typed wrappers around `frappe.call()` / `frappe.xcall()` for all NCE API endpoints.

```typescript
export async function resolveFields(
  doctype: string,
  docname: string,
  fieldPaths: string[]
): Promise<ResolvedFields>

export async function saveResolvedFields(
  doctype: string,
  docname: string,
  fieldValues: FieldValue,
  lockToken?: string
): Promise<SaveResult>

export async function checkEditLock(
  doctype: string,
  docname: string
): Promise<EditLock>

export async function acquireEditLock(
  doctype: string,
  docname: string,
  durationMinutes?: number
): Promise<EditLock>

export async function releaseEditLock(
  doctype: string,
  docname: string
): Promise<{ released: boolean }>

export async function getRandomDocName(
  doctype: string
): Promise<string | null>

export async function getFormDefinition(
  formName: string
): Promise<FormDefinition>
```

Each function is a thin `frappe.xcall('studio.studio.api.<method>', args)` wrapper with proper typing.

---

## Phase 3 — Frontend: PathFinder Panel

**Goal:** Build the PathFinder as a Studio left-panel tab that lets builders visually navigate DocType fields and inject dot-notation bindings.

**Dependencies:** Phase 2 complete (types defined), Studio's `StudioLeftPanel.vue` understood.

---

### Step 3.1 — PathFinder Column Component

**File to create:** `frontend/src/nce/components/PathFinder/PathColumn.vue`

**Source:** Port from NCE Builder's `PathColumn.vue`

**Props:**
- `doctype: string` — the DocType whose fields to display
- `selectedField: string | null` — currently highlighted field
- `multiSelect: boolean` — enable checkbox selection
- `selectedFields: string[]` — (multiSelect mode) checked fields

**Behaviour:**
- On mount: call `frappe.xcall('studio.api.get_doctype_fields', { doctype })` to fetch fields (reuse Studio's existing endpoint)
- Render fields as interactive tiles with colour coding:
  - **Blue** = Link field (clickable → opens next column)
  - **Orange** = Table field (clickable → opens child DocType column)
  - **Purple** = Dynamic Link
  - **Gray** = Data/other fields (selectable as terminal)
- Circular-reference detection: maintain a `visited: Set<string>` in the parent and pass down; if a Link target is already visited, show a ⚠️ icon and disable drill-down
- `@select` event emits `{ fieldname, fieldtype, label, options }` to parent

---

### Step 3.2 — PathFinder Core Component

**File to create:** `frontend/src/nce/components/PathFinder/PathFinderCore.vue`

**Source:** Port from NCE Builder's `PathFinderCore.vue`

**Props:**
- `rootDoctype: string` — starting DocType
- `mode: 'single' | 'multi'` — single-path or multi-field selection

**State:**
- `columns: ref<PathColumn[]>` — array of active columns (each has a `doctype` + `selectedField`)
- `currentPath: computed<string>` — dot-notation string built from selected fields across columns
- `visitedDoctypes: Set<string>` — for circular-reference guard

**Behaviour:**
- Starts with one column showing `rootDoctype` fields
- When a Link field is selected in column N:
  - Truncate columns after N
  - Push a new column for the linked DocType
- When a terminal (non-Link) field is selected:
  - Truncate columns after the current one
  - Emit `@path-selected` with the full dot-notation path

**Template:** Horizontal scrollable container of `<PathColumn>` components with a breadcrumb trail above.

---

### Step 3.3 — PathFinder Dialog (simplified)

**File to create:** `frontend/src/nce/components/PathFinder/PathFinderDialog.vue`

**Source:** Simplified from NCE Builder's `PathDialog.vue` — keep only 2 tabs (drop Jinja Tag and Text Block).

**Tabs:**

| Tab | Purpose |
|-----|---------|
| **Field Path** | Shows `<PathFinderCore>`. Emits the selected dot-notation path. Output: `"customer.territory.parent_territory.name"` |
| **Button Action** | Lists whitelisted methods on the root DocType (via `studio.api.get_whitelisted_methods`). Emits a method binding for action buttons. Output: `"run_method:approve_order"` |

**Props:**
- `doctype: string` — root DocType to navigate
- `modelValue: string` — current binding value (v-model)

**Emits:** `@update:modelValue` with the selected path string.

---

### Step 3.4 — PathFinder Panel Wrapper

**File to create:** `frontend/src/nce/components/PathFinder/PathFinderPanel.vue`

**Purpose:** The panel component that integrates into Studio's left sidebar.

**Behaviour:**
- Header: DocType selector (autocomplete input for choosing the root DocType)
- Body: `<PathFinderCore>` with the selected root DocType
- Footer: "Insert Binding" button — takes the current path and writes it as a `{{ variable.path }}` expression into the currently selected block's active prop field
- Integration with `canvasStore`: reads `canvasStore.selectedBlocks` to know which block/prop to write to

---

### Step 3.5 — Register PathFinder tab in Studio Left Panel

**File to modify:** `frontend/src/components/StudioLeftPanel.vue`

**Changes (additive):**

1. Import `PathFinderPanel`:
   ```typescript
   import PathFinderPanel from '@nce/components/PathFinder/PathFinderPanel.vue'
   ```

2. Add a 6th tab to the tabs array:
   ```typescript
   {
     name: 'pathfinder',
     icon: 'compass',        // or a custom NCE icon
     component: PathFinderPanel,
     label: 'PathFinder'
   }
   ```

3. The tab renders `<PathFinderPanel>` in the secondary panel area when active.

---

### Step 3.6 — Connect PathFinder to Component Properties

**File to modify:** `frontend/src/components/ComponentProperties.vue`

**Changes (additive):**

1. For NCE form-field components (identified by a `nceFieldBinding` prop or similar marker), add a small **🧭 PathFinder** button next to the prop value input.
2. Clicking this button:
   - Opens `<PathFinderDialog>` as a popover/modal
   - Pre-fills the root DocType from the page's form definition (if available)
   - On path selection, writes the dot-notation string into the prop value

---

## Phase 4 — Frontend: Form-Aware Components

**Goal:** Register new Studio component types that wrap Studio's existing primitives with form-specific logic.

**Dependencies:** Phase 2 (types), Phase 3 (PathFinder for binding UI).

---

### Step 4.1 — Form Field Component

**File to create:** `frontend/src/nce/components/FormElements/NceFormField.vue`

**Purpose:** A Studio-renderable component that detects the field type from DocType metadata and renders the appropriate input.

**Props (registered in `components.ts`):**
- `fieldPath: string` — dot-notation binding path (e.g. `"customer_name"` or `"customer.territory.name"`)
- `fieldType: string` — override field type (auto-detected if blank)
- `label: string` — override label (auto-detected if blank)
- `editable: boolean` — default `true`
- `placeholder: string` — optional placeholder text
- `required: boolean` — override required flag

**Behaviour:**
- On mount: resolve `fieldPath` against the active form's DocType meta to determine `fieldtype`, `label`, `options`
- Render the appropriate Frappe UI input: `TextInput` for Data, `Textarea` for Text, `DatePicker` for Date, `Select` for Select, `Checkbox` for Check, `Autocomplete` for Link (with server-side search), etc.
- Two-way binding: reads from `nceFormStore.getFieldValue(fieldPath)` and writes via `nceFormStore.setFieldValue(fieldPath, value)`
- Validation: shows error border + message from `nceFormStore.validationErrors[fieldPath]`

**Field type → component mapping:**

| Frappe fieldtype | Rendered as |
|-----------------|-------------|
| `Data` | `<TextInput>` |
| `Int` / `Float` / `Currency` / `Percent` | `<TextInput type="number">` with appropriate formatting |
| `Date` | `<DatePicker>` |
| `Datetime` | `<DateTimePicker>` |
| `Time` | `<TimePicker>` |
| `Select` | `<Select>` with options from meta |
| `Link` | `<Autocomplete>` with server search |
| `Check` | `<Checkbox>` |
| `Text` / `Small Text` | `<Textarea>` |
| `Text Editor` | `<TextEditor>` |
| `Attach` / `Attach Image` | `<FileUploader>` |
| `Read Only` | `<span>` with formatted value |
| `Table` | Handled by `NcePortalList` instead |

---

### Step 4.2 — Caption Component

**File to create:** `frontend/src/nce/components/FormElements/NceCaption.vue`

**Purpose:** A display-only text element for form labels, section headers, and help text.

**Props:**
- `text: string` — the caption text (supports `{{ expressions }}`)
- `level: 'h1' | 'h2' | 'h3' | 'h4' | 'label' | 'help'` — rendering style
- `fieldPath: string` — optional, resolves a field's label from DocType meta

---

### Step 4.3 — Tab Container Component

**File to create:** `frontend/src/nce/components/FormElements/NceTabContainer.vue`

**Purpose:** Wraps Studio's `<Tabs>` component with form-aware tab grouping.

**Props:**
- `tabs: TabDefinition[]` — tab definitions from form schema (each tab has a label + list of field paths)
- `activeTab: string` — currently active tab (v-model)

**Behaviour:**
- Renders Frappe UI `<Tabs>` with the configured labels
- Each tab panel is a slot that contains the form fields belonging to that tab
- Conditional visibility: if a tab has a `condition` expression, evaluate it against current form data and hide the tab if falsy

---

### Step 4.4 — Portal / Related List Component

**File to create:** `frontend/src/nce/components/FormElements/NcePortalList.vue`

**Purpose:** Renders a child table (Table fieldtype) as an editable data grid within the form.

**Props:**
- `fieldPath: string` — path to the Table field
- `columns: string[]` — which child-table fields to display
- `editable: boolean` — allow inline editing
- `addRows: boolean` — allow adding new rows
- `deleteRows: boolean` — allow deleting rows

**Behaviour:**
- Reads child-table data from `nceFormStore.resolvedData[fieldPath]` (an array)
- Renders using Frappe UI `<ListView>` or a custom grid
- Inline editing writes back via `nceFormStore.setFieldValue(fieldPath, updatedArray)`

---

### Step 4.5 — Action Button Component

**File to create:** `frontend/src/nce/components/FormElements/NceActionButton.vue`

**Purpose:** A button wired to a DocType whitelisted method, record navigation, or form submission.

**Props:**
- `action: 'save' | 'submit' | 'cancel' | 'method' | 'navigate' | 'custom'` — the action type
- `methodName: string` — for `action='method'`, the whitelisted method to call
- `navigateTo: string` — for `action='navigate'`, the target route
- `label: string` — button text
- `variant: string` — Frappe UI button variant
- `confirmMessage: string` — optional confirmation dialog before action

**Behaviour:**
- `save`: calls `nceFormStore.save()`
- `submit`: calls `nceFormStore.save()` then submits the document
- `method`: calls `frappe.xcall(methodName, { name: currentDocname })` then refreshes form data
- `navigate`: uses `router.push()` or `frappe.set_route()`

---

### Step 4.6 — Register NCE components in Studio's component registry

**File to modify:** `frontend/src/data/components.ts`

**Changes (additive — append to COMPONENTS object):**

```typescript
import NceFormField from '@nce/components/FormElements/NceFormField.vue'
import NceCaption from '@nce/components/FormElements/NceCaption.vue'
import NceTabContainer from '@nce/components/FormElements/NceTabContainer.vue'
import NcePortalList from '@nce/components/FormElements/NcePortalList.vue'
import NceActionButton from '@nce/components/FormElements/NceActionButton.vue'

// --- NCE Form Components ---

const NCE_COMPONENTS: Record<string, FrappeUIComponent> = {
  NceFormField: {
    name: 'NceFormField',
    title: 'Form Field',
    icon: FormInputIcon,       // from lucide-vue-next
    initialState: {
      fieldPath: '',
      editable: true,
    },
    additionalProps: {
      fieldPath: { type: 'String', default: '' },
      fieldType: { type: 'String', default: '' },
      label: { type: 'String', default: '' },
      editable: { type: 'Boolean', default: true },
      placeholder: { type: 'String', default: '' },
      required: { type: 'Boolean', default: false },
    },
  },

  NceCaption: {
    name: 'NceCaption',
    title: 'Caption',
    icon: TypeIcon,
    initialState: {
      text: 'Caption',
      level: 'label',
    },
    additionalProps: {
      text: { type: 'String', default: 'Caption' },
      level: { type: 'String', default: 'label' },
      fieldPath: { type: 'String', default: '' },
    },
  },

  NceTabContainer: {
    name: 'NceTabContainer',
    title: 'Tab Container',
    icon: LayoutListIcon,
    initialState: {
      tabs: [{ label: 'Tab 1', fields: [] }],
    },
    additionalProps: {
      tabs: { type: 'Array', default: [] },
    },
    expandArrayProps: true,
  },

  NcePortalList: {
    name: 'NcePortalList',
    title: 'Portal List',
    icon: TableIcon,
    initialState: {
      fieldPath: '',
      editable: true,
      addRows: true,
      deleteRows: true,
    },
    additionalProps: {
      fieldPath: { type: 'String', default: '' },
      columns: { type: 'Array', default: [] },
      editable: { type: 'Boolean', default: true },
      addRows: { type: 'Boolean', default: true },
      deleteRows: { type: 'Boolean', default: true },
    },
    expandArrayProps: true,
  },

  NceActionButton: {
    name: 'NceActionButton',
    title: 'Action Button',
    icon: PlayIcon,
    initialState: {
      action: 'save',
      label: 'Save',
      variant: 'solid',
    },
    additionalProps: {
      action: { type: 'String', default: 'save' },
      methodName: { type: 'String', default: '' },
      navigateTo: { type: 'String', default: '' },
      label: { type: 'String', default: 'Save' },
      variant: { type: 'String', default: 'solid' },
      confirmMessage: { type: 'String', default: '' },
    },
  },
}

// Merge into COMPONENTS
Object.assign(COMPONENTS, NCE_COMPONENTS)
```

---

## Phase 5 — Frontend: Form Runtime

**Goal:** Build the runtime page that renders published NCE forms as working data-entry interfaces.

**Dependencies:** Phase 4 (form components registered), Phase 2 (form store + data pipeline).

---

### Step 5.1 — Form Runtime Page Component

**File to create:** `frontend/src/nce/pages/NceFormRuntime.vue`

**Source:** Port from NCE Builder's `FormPage.vue`, adapted to use Studio's `AppRenderer` patterns.

**Props (from route params):**
- `formName: string` — the NCE Form Definition to load
- `docname?: string` — optional document name (if editing an existing record)

**Lifecycle:**
1. `onMounted`: call `nceFormStore.loadForm(formName)`
2. If `docname` provided: call `nceFormStore.loadRecord(docname)`, then `nceFormStore.acquireLock()`
3. If no `docname`: show record selector (search input + random doc button via `getRandomDocName`)
4. Set up lock auto-refresh interval (every 5 minutes)
5. `onUnmounted`: call `nceFormStore.releaseLock()`, stop auto-refresh

**Template structure:**
```html
<div class="nce-form-runtime">
  <!-- Header: form title, record selector, lock status indicator -->
  <NceFormHeader />

  <!-- Tab container (if form has tabs) -->
  <NceTabContainer v-if="hasTabs" :tabs="formDefinition.tab_layout">
    <template v-for="tab in tabs" #[tab.name]>
      <NceFormGrid :fields="tab.fields" />
    </template>
  </NceTabContainer>

  <!-- Flat field list (if no tabs) -->
  <NceFormGrid v-else :fields="allFields" />

  <!-- Action bar: Save / Submit / Custom buttons -->
  <NceFormActionBar />
</div>
```

---

### Step 5.2 — Form Grid Renderer

**File to create:** `frontend/src/nce/components/FormElements/NceFormGrid.vue`

**Source:** Port from NCE Builder's `GridFormRenderer.vue`

**Props:**
- `fields: string[]` — list of field paths to render
- `gridConfig: GridConfig` — CSS Grid configuration (columns, gaps, field placements)

**Behaviour:**
- Resolves each field path against DocType meta to get field type and label
- Positions fields on a CSS Grid according to `gridConfig` (or auto-layout if no grid config)
- Each field renders as `<NceFormField>` with the appropriate props
- Exposes `getFormData()` to parent for submission

---

### Step 5.3 — Form Header Component

**File to create:** `frontend/src/nce/components/FormElements/NceFormHeader.vue`

**Purpose:** Shows form title, record selector, and lock status.

**Features:**
- Form title from `formDefinition.form_title`
- Record selector: `<Autocomplete>` searching the target DocType + "Random" button
- Lock status indicator: 🔒 green (you have lock) / 🔒 red (someone else) / 🔓 (no lock)
- Dirty indicator: shows unsaved changes count

---

### Step 5.4 — Form Action Bar Component

**File to create:** `frontend/src/nce/components/FormElements/NceFormActionBar.vue`

**Purpose:** Bottom action bar with Save/Submit/Cancel buttons based on `formDefinition.submission_action`.

---

### Step 5.5 — Register Form Runtime Route

**File to modify:** `frontend/src/router/studio_router.ts`

**Changes (additive):**

```typescript
import NceFormRuntime from '@nce/pages/NceFormRuntime.vue'

// Add to routes array:
{
  path: '/form/:formName/:docname?',
  name: 'NceFormRuntime',
  component: NceFormRuntime,
  props: true,
}
```

**File to modify:** `frontend/src/router/app_router.ts`

**Changes (additive):** Add a runtime route so published NCE forms are accessible:

```typescript
{
  path: '/nce-form/:formName/:docname?',
  name: 'NceFormRuntime',
  component: NceFormRuntime,
  props: true,
}
```

---

### Step 5.6 — Schema Helpers

**File to create:** `frontend/src/nce/utils/schemaHelpers.ts`

**Source:** Port from NCE Builder's `schema-helpers.ts`

**Exports:**

| Function | Purpose |
|----------|---------|
| `mapFieldsToTabs(schema, tabLayout)` | Groups field paths into tab buckets |
| `resolveFieldMapping(fieldMapping, docMeta)` | Merges field mapping with DocType metadata |
| `evaluateCondition(condition, formData)` | Evaluates a JS condition string against current form data |
| `getFieldComponent(fieldtype)` | Returns the appropriate Frappe UI component name for a field type |
| `buildGridConfig(fields, gridLayout)` | Generates CSS Grid placement rules from layout config |

---

### Step 5.7 — useFormSchema Composable

**File to create:** `frontend/src/nce/utils/useFormSchema.ts`

**Source:** Port from NCE Builder's `useFormSchema.ts`

**Purpose:** Vue composable that loads an NCE Form Definition and parses it into a reactive structure consumable by form components.

**Returns:**
```typescript
{
  schema: Ref<FormDefinition | null>
  fields: Ref<FieldMeta[]>
  tabs: Ref<TabDefinition[]>
  hasTabs: Ref<boolean>
  targetDoctype: Ref<string>
  submissionAction: Ref<string>
  isLoaded: Ref<boolean>
  load: (formName: string) => Promise<void>
}
```

---

## Phase 6 — Theme System

**Goal:** Implement the OKLCH colour engine, theme settings UI, and CSS variable injection.

**Dependencies:** Phase 1 (NCE Theme Settings DocType exists), Phase 0 (directory structure).

> This phase can run in parallel with Phases 3–5 since it has no dependency on the form or PathFinder systems.

---

### Step 6.1 — OKLCH Colour Engine

**File to create:** `frontend/src/nce/utils/colorShades.ts`

**Source:** Port directly from NCE Builder's `color-shades.ts` (179 lines of pure colour math — no dependencies).

**Exports:**

| Function | Purpose |
|----------|---------|
| `hexToOklch(hex: string): [number, number, number]` | Convert hex colour to OKLCH |
| `oklchToHex(L: number, C: number, H: number): string` | Convert OKLCH back to hex with gamut mapping |
| `generateShades(hex: string): ColorShade[]` | Generate 11 perceptual shade steps (50–950) |
| `isDark(hex: string): boolean` | Returns true if the colour is perceptually dark |
| `gamutMap(L: number, C: number, H: number): [number, number, number]` | Binary search gamut mapping for sRGB |

---

### Step 6.2 — Theme Defaults & CSS Variable System

**File to create:** `frontend/src/nce/utils/useThemeDefaults.ts`

**Source:** Port from NCE Builder's `useThemeDefaults.ts`

**Exports:**

| Export | Purpose |
|--------|---------|
| `DEFAULT_THEME: ThemeSettings` | 17-colour default palette + 10 typography/layout defaults |
| `CSS_VARIABLE_MAP: Record<string, string>` | Maps theme field names to CSS variable names (e.g. `primary_color` → `--nce-primary`) |
| `getCSSVariables(settings: ThemeSettings): Record<string, string>` | Generates all CSS variables including shade scales |
| `applyToRoot(settings: ThemeSettings): void` | Applies CSS variables to `document.documentElement.style` |
| `useThemeState()` | Reactive composable: `theme`, `shades`, `cssVariables`, `apply()`, `reset()` |

---

### Step 6.3 — Theme Injector

**File to create:** `frontend/src/nce/utils/themeInjector.ts`

**Source:** Adapted from NCE Builder's `theme-injector.ts`

**Purpose:** Generates the full CSS variable declaration block and injects it as a `<style>` tag or applies via `document.documentElement.style`.

**Exports:**

| Function | Purpose |
|----------|---------|
| `generateThemeCSS(settings: ThemeSettings): string` | Produces a complete `:root { ... }` CSS block |
| `injectTheme(settings: ThemeSettings): void` | Creates/updates a `<style id="nce-theme">` element in `<head>` |
| `removeTheme(): void` | Removes the injected style element |
| `mapBorderRadius(keyword: string): string` | Maps `"small"`, `"medium"`, `"large"`, `"pill"` to rem values |
| `mapSpacing(keyword: string): string` | Maps `"compact"`, `"comfortable"`, `"spacious"` to rem values |

---

### Step 6.4 — Brand Colour Picker Component

**File to create:** `frontend/src/nce/components/Theme/BrandColorPicker.vue`

**Source:** Port from NCE Builder's `BrandColorPicker.vue` (519 lines)

**Features:**
- Apple-style colour grid (12 anchor hues × 9 lightness rows)
- HSV sliders (Hue, Saturation, Value)
- Hex input with validation
- EyeDropper API support (browser native)
- Copy-to-clipboard
- Shade preview strip (shows the 11 OKLCH shades that will be generated)
- `v-model` for the selected hex colour

---

### Step 6.5 — Swatch Picker Component

**File to create:** `frontend/src/nce/components/Theme/SwatchPicker.vue`

**Source:** Port from NCE Builder's `SwatchPicker.vue`

**Purpose:** Quick palette picker showing all 11 shades for primary, secondary, and gray. Uses `generateShades()`.

---

### Step 6.6 — Theme Settings Page

**File to create:** `frontend/src/nce/pages/ThemeSettingsPage.vue`

**Source:** Adapted from NCE Builder's `ThemeSettingsPage.vue`

**Layout:** Full-page editor within Studio, with tabs:

| Tab | Contents |
|-----|----------|
| **Colours** | 16 `<BrandColorPicker>` instances, one per colour field. Each shows shade preview. |
| **Typography** | Font family selector (system fonts + Google Fonts), size/weight/line-height inputs |
| **Layout** | Border radius selector (visual), spacing selector, shadow style picker, width inputs |
| **Dark Mode** | Toggle + auto-generated dark palette preview |
| **Custom CSS** | CodeMirror editor for `custom_css` field |
| **Tailwind** | CodeMirror editor for `tailwind_overrides` JSON |

**Behaviour:**
- Loads from `NCE Theme Settings` singleton on mount
- Live preview: every change calls `applyToRoot()` to update CSS variables in real time
- Save: calls `frappe.xcall('frappe.client.save', { doc: settings })` → triggers `on_update` → regenerates CSS file
- PostMessage: if a preview window is open, sends theme changes via `window.postMessage()`

---

### Step 6.7 — Theme Preview Page

**File to create:** `frontend/src/nce/pages/ThemePreviewPage.vue`

**Source:** Port from NCE Builder's `ThemePreviewPage.vue`

**Purpose:** A showcase page displaying all UI component types styled by the current theme — buttons, form fields, tables, cards, badges, alerts, etc.

**Behaviour:**
- Listens for `postMessage` from `ThemeSettingsPage`
- On message: calls `applyToRoot()` with the received theme settings
- Shows a grid of component examples in different states/variants

---

### Step 6.8 — Theme Panel for Studio Editor

**File to create:** `frontend/src/nce/components/Theme/ThemePanel.vue`

**Purpose:** A compact theme control panel that can be embedded in Studio's right panel or accessed as a toolbar action.

**Features:**
- Quick-access colour swatches for primary/secondary/accent
- Font family dropdown
- "Open Full Settings" button → navigates to `ThemeSettingsPage`
- Live CSS variable readout

---

### Step 6.9 — Register Theme Routes

**File to modify:** `frontend/src/router/studio_router.ts`

**Changes (additive):**

```typescript
import ThemeSettingsPage from '@nce/pages/ThemeSettingsPage.vue'
import ThemePreviewPage from '@nce/pages/ThemePreviewPage.vue'

// Add to routes:
{
  path: '/theme',
  name: 'ThemeSettings',
  component: ThemeSettingsPage,
},
{
  path: '/theme/preview',
  name: 'ThemePreview',
  component: ThemePreviewPage,
},
```

---

### Step 6.10 — Hook Theme CSS into Studio

**File to modify:** `studio/hooks.py` (already touched in Step 1.5)

**Ensure:**
- `app_include_css` includes the generated `nce_theme.css`
- The `NCE Theme Settings` `on_update` triggers CSS regeneration

**File to create:** `frontend/src/nce/utils/themeInit.ts`

**Purpose:** Called once in Studio's `main.ts` (or via a plugin) to load theme settings and apply CSS variables on app startup.

```typescript
export async function initializeTheme(): Promise<void> {
  const settings = await frappe.xcall(
    'studio.studio.api.get_theme_settings'
  )
  if (settings) {
    applyToRoot(settings)
  }
}
```

**File to modify:** `frontend/src/main.ts`

**Change (additive):** After the app mounts, call `initializeTheme()`.

---

## Phase 7 — Integration, Wiring & Polish

**Goal:** Wire everything together, ensure cross-capability interactions work, and polish the developer experience.

**Dependencies:** Phases 3–6 complete.

---

### Step 7.1 — PathFinder ↔ Form Field binding

**File to modify:** `frontend/src/nce/components/FormElements/NceFormField.vue`

**Change:** Add a design-time overlay (visible only in Studio editor mode) that:
- Shows the current `fieldPath` binding as a badge
- On click: opens `<PathFinderDialog>` to change the binding
- On path selected: updates the block's `fieldPath` prop via `blockController.setKeyValue()`

**Detection of editor mode:** Check `import.meta.env.MODE === 'development'` or use a `provide/inject` flag from `StudioCanvas`.

---

### Step 7.2 — NCE Form Definition management UI

**File to create:** `frontend/src/nce/components/NceFormManager.vue`

**Purpose:** A panel or dialog within Studio that lets builders create and manage NCE Form Definitions.

**Features:**
- List existing form definitions (for the current Studio App)
- Create new: select target DocType → auto-generate initial schema from DocType meta
- Edit: opens the form definition fields in a settings panel
- Link to Studio Page: associates the form with a page for runtime rendering

---

### Step 7.3 — Extend Studio's data binding for NCE

**File to modify:** `frontend/src/stores/codeStore.ts`

**Changes (additive):**

Add NCE-specific variable sources to the autocomplete system:
- `$form.fieldPath` — autocomplete paths from the active form's field mapping
- `$form.data.fieldPath` — autocomplete paths to resolved form data
- `$lock.status` — edit lock status variable

---

### Step 7.4 — Canvas component rendering for NCE types

**File to modify:** `frontend/src/utils/components.ts`

**Changes (additive):**

Ensure the component resolver recognizes NCE component names (`NceFormField`, `NceCaption`, etc.) and loads them from the `@nce/components/FormElements/` directory.

Add NCE components to the dynamic import map if Studio uses lazy loading for component rendering.

---

### Step 7.5 — NCE component palette group

**File to modify:** `frontend/src/data/components.ts`

**Change:** Add a `category: 'NCE Forms'` field to all NCE components so they appear in a dedicated section of the Studio component palette.

This may require a minor update to the `ComponentPanel` (Studio's component picker) to support category grouping — or it may already support it. If not:

**File to modify:** `frontend/src/components/ComponentPanel.vue` (or wherever the palette renders)

**Change:** Group components by category, showing "NCE Forms" as a collapsible section alongside "Layout", "Input", "Display", etc.

---

### Step 7.6 — Form runtime integration with AppRenderer

**File to modify (if needed):** `frontend/src/AppRenderer.vue`

**Change:** When a Studio page contains NCE form components, the renderer needs to:
1. Initialize `nceFormStore` with the page's linked form definition
2. Provide the form store to all child components via Vue's `provide/inject`
3. Handle form lifecycle (load, lock, save) at the page level

This may be accomplished by adding a check in `AppRenderer.vue`'s setup:

```typescript
// If this page has an NCE form definition linked
const nceFormStore = useNceFormStore()
if (page.nce_form_definition) {
  await nceFormStore.loadForm(page.nce_form_definition)
}
provide('nceFormStore', nceFormStore)
```

---

### Step 7.7 — Polish: loading states, error handling, toasts

**Files to modify:** All NCE components.

**Changes:**
- Add skeleton loaders while form data is resolving
- Add error boundaries around field resolution (graceful fallback if a path is invalid)
- Use `vue-sonner` toasts (already in Studio's dependencies) for save success/failure
- Add lock conflict dialogs (when another user has the lock)

---

## Phase 8 — Testing & Validation

**Goal:** Ensure all NCE capabilities work correctly in isolation and when integrated.

---

### Step 8.1 — Backend unit tests

**Files to create:**

| Path | Tests |
|------|-------|
| `studio/studio/doctype/nce_form_definition/test_nce_form_definition.py` | CRUD, schema validation, resolved schema output |
| `studio/studio/doctype/nce_edit_lock/test_nce_edit_lock.py` | Lock acquire/release/expiry, concurrent lock conflict |
| `studio/studio/doctype/nce_theme_settings/test_nce_theme_settings.py` | Settings save, CSS generation, default values |
| `studio/studio/test_api.py` | All 7 API endpoints: resolve_fields, save_resolved_fields, check/acquire/release lock, get_random_doc_name, regenerate_theme_css |

**Key test scenarios for `resolve_fields`:**
- Single-level field resolution
- Multi-level link chain (3+ hops)
- Null link in chain → returns None
- Invalid field path → graceful error
- Permission denied → appropriate error

**Key test scenarios for `save_resolved_fields`:**
- Write to direct field
- Write through link chain
- Write with valid lock → succeeds
- Write with expired lock → fails
- Write with another user's lock → fails
- Partial write failure → reports which docs failed

**Key test scenarios for edit locking:**
- Acquire when no lock exists → succeeds
- Acquire when self already holds lock → extends
- Acquire when another user holds lock → fails
- Release own lock → succeeds
- Check expired lock → reports unlocked
- Concurrent acquire attempts (race condition guard)

---

### Step 8.2 — Frontend component tests

**Files to create:**

| Path | Tests |
|------|-------|
| `frontend/src/nce/__tests__/PathFinderCore.test.ts` | Column rendering, drill-down, circular reference detection, path construction |
| `frontend/src/nce/__tests__/NceFormField.test.ts` | Field type detection, value rendering, change events |
| `frontend/src/nce/__tests__/colorShades.test.ts` | Shade generation accuracy, hex↔OKLCH roundtrip, gamut mapping |
| `frontend/src/nce/__tests__/dataPipeline.test.ts` | API wrapper typing, error handling |
| `frontend/src/nce/__tests__/nceFormStore.test.ts` | Form load, field value management, dirty tracking, save |

---

### Step 8.3 — Integration test scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| **End-to-end form** | Create NCE Form Definition → design form in Studio with NCE fields → publish → open runtime → load record → edit → save | Record updated in database |
| **PathFinder binding** | Open PathFinder → navigate 3 levels deep → select field → binding written to NceFormField prop | Correct dot-notation path in component prop |
| **Edit lock conflict** | User A opens form → User B opens same form → User B sees lock warning → User A saves → User B can acquire lock | Proper lock handoff |
| **Theme application** | Change primary colour → all NCE shades update → save → reload page → theme persists | CSS variables correct, shades perceptually even |
| **Link chain read/write** | Form with `customer.territory.name` field → resolves correctly → edit → save → verify `Territory` doc updated | Intermediate doc updated, not root doc |

---

### Step 8.4 — Visual regression checks

**Manual verification checklist:**

- [ ] PathFinder columns scroll horizontally on overflow
- [ ] PathFinder colour coding matches: Blue=Link, Orange=Table, Purple=Dynamic Link
- [ ] Form fields render correct input types for all 15+ Frappe fieldtypes
- [ ] Tab container shows/hides tabs based on conditions
- [ ] Theme shade strips show smooth perceptual gradients
- [ ] Brand colour picker HSV sliders are responsive
- [ ] Lock status indicator updates in real time
- [ ] Form dirty state clears after successful save
- [ ] NCE components appear in a dedicated palette section

---

## File Index

### New Files (to create)

| # | Path | Phase | Purpose |
|---|------|-------|---------|
| 1 | `studio/studio/__init__.py` | 0 | Package init |
| 2 | `studio/studio/doctype/__init__.py` | 0 | DocType package |
| 3 | `studio/studio/api.py` | 1 | All NCE API endpoints |
| 4 | `studio/studio/doctype/nce_form_definition/nce_form_definition.json` | 1 | Form Definition DocType |
| 5 | `studio/studio/doctype/nce_form_definition/nce_form_definition.py` | 1 | Form Definition controller |
| 6 | `studio/studio/doctype/nce_form_definition/__init__.py` | 1 | |
| 7 | `studio/studio/doctype/nce_edit_lock/nce_edit_lock.json` | 1 | Edit Lock DocType |
| 8 | `studio/studio/doctype/nce_edit_lock/nce_edit_lock.py` | 1 | Edit Lock controller |
| 9 | `studio/studio/doctype/nce_edit_lock/__init__.py` | 1 | |
| 10 | `studio/studio/doctype/nce_theme_settings/nce_theme_settings.json` | 1 | Theme Settings DocType (Single) |
| 11 | `studio/studio/doctype/nce_theme_settings/nce_theme_settings.py` | 1 | Theme Settings controller |
| 12 | `studio/studio/doctype/nce_theme_settings/__init__.py` | 1 | |
| 13 | `frontend/src/nce/types/index.ts` | 2 | TypeScript type definitions |
| 14 | `frontend/src/nce/stores/nceFormStore.ts` | 2 | Form lifecycle store |
| 15 | `frontend/src/nce/stores/nceEditLockStore.ts` | 2 | Edit lock store |
| 16 | `frontend/src/nce/utils/dataPipeline.ts` | 2 | API wrapper functions |
| 17 | `frontend/src/nce/components/PathFinder/PathColumn.vue` | 3 | Single DocType field column |
| 18 | `frontend/src/nce/components/PathFinder/PathFinderCore.vue` | 3 | Multi-column navigation engine |
| 19 | `frontend/src/nce/components/PathFinder/PathFinderDialog.vue` | 3 | Field Path + Button Action dialog |
| 20 | `frontend/src/nce/components/PathFinder/PathFinderPanel.vue` | 3 | Studio left-panel integration |
| 21 | `frontend/src/nce/components/FormElements/NceFormField.vue` | 4 | Form-aware field component |
| 22 | `frontend/src/nce/components/FormElements/NceCaption.vue` | 4 | Caption/label component |
| 23 | `frontend/src/nce/components/FormElements/NceTabContainer.vue` | 4 | Form-aware tab container |
| 24 | `frontend/src/nce/components/FormElements/NcePortalList.vue` | 4 | Child table portal/grid |
| 25 | `frontend/src/nce/components/FormElements/NceActionButton.vue` | 4 | DocType action button |
| 26 | `frontend/src/nce/pages/NceFormRuntime.vue` | 5 | Form runtime page |
| 27 | `frontend/src/nce/components/FormElements/NceFormGrid.vue` | 5 | CSS Grid form renderer |
| 28 | `frontend/src/nce/components/FormElements/NceFormHeader.vue` | 5 | Form header with record selector |
| 29 | `frontend/src/nce/components/FormElements/NceFormActionBar.vue` | 5 | Form action bar |
| 30 | `frontend/src/nce/utils/schemaHelpers.ts` | 5 | Form schema utilities |
| 31 | `frontend/src/nce/utils/useFormSchema.ts` | 5 | Form schema composable |
| 32 | `frontend/src/nce/utils/colorShades.ts` | 6 | OKLCH colour engine |
| 33 | `frontend/src/nce/utils/useThemeDefaults.ts` | 6 | Theme defaults + CSS var system |
| 34 | `frontend/src/nce/utils/themeInjector.ts` | 6 | CSS variable injection |
| 35 | `frontend/src/nce/components/Theme/BrandColorPicker.vue` | 6 | Full-featured colour picker |
| 36 | `frontend/src/nce/components/Theme/SwatchPicker.vue` | 6 | Palette swatch picker |
| 37 | `frontend/src/nce/pages/ThemeSettingsPage.vue` | 6 | Full theme editor |
| 38 | `frontend/src/nce/pages/ThemePreviewPage.vue` | 6 | Theme component showcase |
| 39 | `frontend/src/nce/components/Theme/ThemePanel.vue` | 6 | Compact theme panel |
| 40 | `frontend/src/nce/utils/themeInit.ts` | 6 | Theme initialization on app load |
| 41 | `frontend/src/nce/components/NceFormManager.vue` | 7 | Form definition management UI |
| 42–46 | `studio/studio/test_*.py` | 8 | Backend tests |
| 47–51 | `frontend/src/nce/__tests__/*.test.ts` | 8 | Frontend tests |

### Existing Files to Modify (additive changes only)

| # | Path | Phase | Change |
|---|------|-------|--------|
| 1 | `studio/modules.txt` | 0 | Add `NCE Studio` module |
| 2 | `frontend/vite.config.js` | 0 | Add `@nce` path alias |
| 3 | `frontend/tailwind.config.js` | 0 | Add NCE content paths |
| 4 | `studio/hooks.py` | 1 | Add NCE CSS include, doc_events, route rules |
| 5 | `studio/patches.txt` | 1 | Add NCE patches section header |
| 6 | `frontend/src/data/components.ts` | 4 | Register 5 NCE form components |
| 7 | `frontend/src/components/StudioLeftPanel.vue` | 3 | Add PathFinder tab (6th tab) |
| 8 | `frontend/src/components/ComponentProperties.vue` | 3 | Add PathFinder button for NCE props |
| 9 | `frontend/src/router/studio_router.ts` | 5+6 | Add form runtime + theme routes |
| 10 | `frontend/src/router/app_router.ts` | 5 | Add form runtime route for published apps |
| 11 | `frontend/src/stores/codeStore.ts` | 7 | Add NCE variable sources to autocomplete |
| 12 | `frontend/src/utils/components.ts` | 7 | Register NCE components in resolver |
| 13 | `frontend/src/main.ts` | 6 | Call `initializeTheme()` on startup |
| 14 | `frontend/src/AppRenderer.vue` | 7 | Initialize nceFormStore for NCE pages |

---

## Estimated Effort

| Phase | New Files | Modified Files | Complexity | Est. Days |
|-------|-----------|----------------|------------|-----------|
| 0 — Scaffolding | ~10 | 3 | Low | 0.5 |
| 1 — Backend | 10 | 2 | Medium | 3 |
| 2 — Data Pipeline | 4 | 0 | Medium | 2 |
| 3 — PathFinder | 4 | 2 | High | 4 |
| 4 — Form Components | 5 | 1 | High | 4 |
| 5 — Form Runtime | 6 | 2 | High | 5 |
| 6 — Theme System | 9 | 2 | High | 5 |
| 7 — Integration | 1 | 5 | Medium | 3 |
| 8 — Testing | 10 | 0 | Medium | 4 |
| **Total** | **~51** | **~14** | | **~30 days** |

---

## Notes & Decisions

### Naming Conventions

- **Python:** `studio.` prefix for all backend modules (e.g. `studio.studio.api`)
- **TypeScript:** `@nce/` alias for all frontend imports
- **Components:** `Nce` prefix for all Vue components (e.g. `NceFormField`, `NceActionButton`)
- **CSS:** `--nce-` prefix for all CSS variables, `.nce-` prefix for all CSS classes
- **DocTypes:** `NCE ` prefix for all DocTypes (e.g. `NCE Form Definition`, `NCE Edit Lock`)

### What We Intentionally Do NOT Port

- `NceForm.vue` — FormKit-based renderer (superseded by `GridFormRenderer` / Studio canvas)
- `formkit.config.ts` — FormKit Pro dependency (removed)
- `HomePage.vue` — Studio has its own home screen
- `FormListPage.vue` — Studio's PagesPanel covers this
- `ColorField.vue` — BrandColorPicker is more capable
- `ThemePreview.vue` — Superseded by `ThemePreviewPage.vue`
- `SelectField.vue` — Frappe UI Select covers this

### Open Questions

1. **Module isolation:** Should NCE DocTypes live under `studio/studio/` (same Frappe app) or in the separate `studio` Frappe app we scaffolded earlier? Recommendation: keep them in the Studio fork for now, move to the separate app later if we need independent deployment.

2. **OKLCH Python implementation:** The backend needs to generate shades for the CSS file. Options: (a) port the TS colour math to Python, (b) call a Node script during CSS generation, (c) use `coloraide` Python library. Recommendation: (a) port to Python — it's only ~100 lines of math.

3. **Theme CSS delivery:** Should we write to a static file (requires bench restart awareness) or serve dynamically via a controller endpoint? Recommendation: static file with cache-busting query parameter (e.g. `/files/nce_theme.css?v={hash}`).

4. **PathFinder in left panel vs. floating:** The catalogue says "floating panel or left-panel tab." Recommendation: start with left-panel tab (Step 3.5) since it integrates cleanly with Studio's existing panel system. Add floating mode later if users request it.