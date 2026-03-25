# NCE Studio

NCE Studio is a single Frappe application that combines a forked and extended version of [Frappe Studio](https://github.com/frappe/studio) with a full set of NCE-specific capabilities — form-aware components, a PathFinder panel, an OKLCH theme system, and a Frappe backend with custom DocTypes and API endpoints.

Everything lives in one repo and is installed as one Frappe app.

---

## What's Inside

### Backend (`studio/`)
The Frappe Python app, providing:

- **NCE Form Definition** DocType — stores the schema for NCE form pages
- **NCE Edit Lock** DocType — collaborative edit locking with token-based acquisition
- **NCE Theme Settings** DocType (Single) — persists brand colours and theme configuration
- **NCE API** (`studio/api/nce_api.py`) — whitelisted endpoints for field resolution, save, lock management, and theme CSS regeneration
- Standard Frappe hooks, patches, fixtures, and install scripts

### Frontend (`frontend/src/`)
A fork of the Frappe Studio Vue 3 / TypeScript frontend, extended with:

| Area | Files |
|------|-------|
| **NCE Types** | `nce/types/index.ts` — shared TypeScript interfaces |
| **Data Pipeline** | `nce/utils/dataPipeline.ts` — API wrapper functions |
| **Stores** | `nce/stores/nceFormStore.ts`, `nceEditLockStore.ts` |
| **PathFinder** | `nce/components/PathFinder/` — multi-column DocType field navigator, integrated as a Studio left-panel tab |
| **Form Elements** | `nce/components/FormElements/` — `NceFormField`, `NceCaption`, `NceTabContainer`, `NcePortalList`, `NceActionButton` |
| **Form Runtime** | `nce/pages/NceFormRuntime.vue` — live form renderer with grid layout, header, and action bar |
| **Theme System** | `nce/theme/` — OKLCH colour engine, CSS variable injection, `BrandColorPicker`, `SwatchPicker`, `ThemeSettingsPage`, `ThemePreviewPage`, `ThemePanel` |
| **Component Palette** | `nce/components/palette/` — NCE component group in the Studio drag-and-drop palette |
| **Tests** | `nce/tests/` — Vitest unit tests for colour engine, theme defaults, form binding, and palette |

---

## Directory Structure

```
studio/                          ← repo root
├── frontend/                    ← Vue 3 frontend (Frappe Studio fork + NCE extensions)
│   └── src/
│       ├── components/          ← Frappe Studio UI components (extended)
│       ├── stores/              ← Frappe Studio Pinia stores (extended)
│       ├── router/              ← Studio + NCE routes
│       └── nce/                 ← All NCE-specific frontend code
│           ├── components/
│           │   ├── FormElements/
│           │   ├── PathFinder/
│           │   ├── Theme/
│           │   └── palette/
│           ├── pages/
│           ├── stores/
│           ├── theme/
│           ├── types/
│           ├── utils/
│           └── tests/
└── studio/                      ← Frappe Python app
    ├── api/
    │   └── nce_api.py
    ├── nce_module/
    │   └── doctype/
    ├── public/
    ├── hooks.py
    └── install.py
```

---

## Installation

```bash
bench get-app https://github.com/oliver-nce/studio
bench --site your-site install-app studio
```

---

## Development

### Backend

```bash
# After schema changes
bench --site your-site migrate

# Clear cache
bench --site your-site clear-cache

# Run Python tests
bench --site your-site run-tests --app studio
```

### Frontend

```bash
cd frontend

# Install dependencies
yarn install

# Development server (with hot reload)
yarn dev

# Production build
yarn build

# Run unit tests
yarn test
```

### Full asset rebuild

```bash
bench build --app studio
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Frappe v15 / v16 |
| Frontend | Vue 3, TypeScript, Vite |
| Styling | Tailwind CSS, OKLCH CSS variables |
| State | Pinia |
| Testing | Vitest (frontend), Frappe test runner (backend) |
| Package manager | Yarn |

---

## License

MIT — see [LICENSE](LICENSE)
```

