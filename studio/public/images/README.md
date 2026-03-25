# App Images & Logos

This directory is served at `/assets/studio/images/` by the Frappe web server.

## Logo Requirements

### `logo.png` (required for v16)

Frappe v16 introduced an Android-style app drawer that displays an app logo. The `app_logo_url` in `hooks.py` points here:

```python
app_logo_url = "/assets/studio/images/logo.png"
```

**Specifications:**
- **Format:** PNG (with transparency) or SVG
- **Size:** 128×128 px minimum, 512×512 px recommended
- **Shape:** Square — Frappe may apply its own rounding/masking
- **Background:** Transparent or solid colour (avoid white-on-white)

> **v15 note:** This field is safely ignored by Frappe v15. No harm in including it.

### `logo.svg` (included as placeholder)

A placeholder SVG logo is provided. Replace it with your own branding.

## Other Images

Place any app-wide images here (e.g. onboarding graphics, empty-state illustrations). They will be accessible at:

```
/assets/studio/images/<filename>
```

## Related Directories

| Directory | Purpose |
|---|---|
| `../icons/` | Custom SVG icons for sidebar, workspace shortcuts, etc. |
| `../logos/` | Additional logo variants (dark mode, monochrome, favicon) |