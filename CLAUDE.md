# NCE Studio — Frappe App

## Before You Start

Read `CODE_INDEX.json` in this directory first. It maps every module to its purpose, exports, and dependencies so you can go straight to the right file without scanning the whole tree.

## Project Structure

- `studio/` — Python backend (Frappe doctypes, whitelisted APIs, utilities)
- `frontend/src/nce/` — Vue 3 + Pinia frontend (NCE-specific code)
- `frontend/src/` — Upstream Frappe Studio frontend (do not modify without good reason)

## Data Flow

```
Vue Component → Pinia Store → dataPipeline.ts → nce_api.py → lock_api / field_api / theme_api → Frappe ORM
```

The frontend never touches the database directly. All data goes through `frappe.call()` to 9 whitelisted endpoints re-exported from `studio/api/nce_api.py`.

## Key Rules

1. **Security**: Use `is_system_manager()` from `studio/utils.py` for role checks — never inline `"System Manager" in frappe.get_roles()`. Use `safeEval.ts` for frontend expression evaluation — never `new Function()` or `eval()`.
2. **Locking**: Edit locks use `SELECT FOR UPDATE` for atomicity. See `lock_api.py`.
3. **CSS injection**: All CSS values are validated server-side in `nce_theme_settings.py` before injection.
4. **Permissions**: Every `@frappe.whitelist()` endpoint must include a permission check.
5. **v15/v16 compat**: Use helpers from `studio/utils.py` (`is_v16_or_later()`, `get_desk_route()`, `try_import()`) — never hard-code version-specific paths.

## Running Tests

```bash
# Backend (from frappe-bench directory)
bench run-tests --app studio

# Frontend
cd studio/frontend && npx vitest run
```

## Common Tasks — Where to Look

| Task | Backend | Frontend |
|------|---------|----------|
| Edit locking | `api/lock_api.py`, `doctype/nce_edit_lock/` | `stores/nceEditLockStore.ts`, `dataPipeline.ts` |
| Form fields | `api/field_api.py`, `doctype/nce_form_definition/` | `stores/nceFormStore.ts`, `composables/useFieldMeta.ts` |
| Theme/styling | `api/theme_api.py`, `doctype/nce_theme_settings/` | `theme/colorShades.ts`, `theme/useThemeDefaults.ts` |
| Save/submit | `api/field_api.py` (`save_resolved_fields`) | `composables/useSaveAction.ts` |
| Condition logic | — | `utils/safeEval.ts`, `utils/schemaHelpers.ts` |
| PathFinder | — | `components/PathFinder/` |
