NCE Studio/studio/README.md
``````

# NCE Studio

> **Frappe v15 / v16 compatible app**

A custom Frappe application built with NCE Studio that works across both Frappe v15 and v16.

---

## 📁 Directory Structure

```text
studio/
├── .github/workflows/         # CI/CD (GitHub Actions)
│   └── ci.yml
├── studio/                    # Python package root
│   ├── __init__.py
│   ├── hooks.py               # App hooks — the nerve centre
│   ├── modules.txt            # Registered Frappe modules
│   ├── patches.txt            # Patch execution order
│   ├── api/                   # Whitelisted API endpoints
│   │   ├── __init__.py
│   │   └── nce_api.py
│   ├── config/                # Desk & portal config
│   │   ├── __init__.py
│   │   ├── desktop.py
│   │   └── docs.py
│   ├── fixtures/              # Exportable fixtures (JSON)
│   │   └── .gitkeep
│   ├── nce_module/            # Your first Frappe module
│   │   ├── __init__.py
│   │   ├── doctype/
│   │   │   ├── __init__.py
│   │   │   └── nce_doctype/   # Sample DocType scaffold
│   │   │       ├── __init__.py
│   │   │       ├── nce_doctype.json
│   │   │       ├── nce_doctype.py
│   │   │       ├── nce_doctype.js
│   │   │       └── test_nce_doctype.py
│   │   ├── workspace/
│   │   │   └── nce_module.json
│   │   ├── report/
│   │   │   └── nce_report/
│   │   │       ├── __init__.py
│   │   │       ├── nce_report.json
│   │   │       ├── nce_report.py
│   │   │       └── nce_report.js
│   │   └── client_scripts/
│   │       └── .gitkeep
│   ├── overrides/             # DocType class overrides
│   │   ├── __init__.py
│   │   └── .gitkeep
│   ├── patches/               # Data migration patches
│   │   ├── __init__.py
│   │   └── v1_0/
│   │       ├── __init__.py
│   │       └── .gitkeep
│   ├── public/                # Served at /assets/studio/
│   │   ├── css/
│   │   │   └── studio.css
│   │   ├── js/
│   │   │   └── studio.js
│   │   ├── images/
│   │   │   └── logo.png       # ← app_logo_url target (v16)
│   │   ├── icons/
│   │   │   └── .gitkeep
│   │   └── logos/
│   │       └── .gitkeep
│   ├── templates/             # Jinja templates
│   │   ├── pages/
│   │   │   └── .gitkeep
│   │   ├── includes/
│   │   │   ├── navbar.html
│   │   │   └── footer.html
│   │   └── emails/
│   │       └── .gitkeep
│   ├── tests/                 # App-level test utilities
│   │   ├── __init__.py
│   │   └── test_utils.py
│   └── www/                   # Portal / website pages
│       └── .gitkeep
├── .editorconfig
├── .gitignore
├── .flake8
├── LICENSE
├── MANIFEST.in
├── pyproject.toml             # Modern packaging (PEP 621)
├── README.md                  # ← You are here
├── requirements.txt
└── setup.py                   # Legacy compatibility shim
```

---

## 🚀 Installation

```bash
# From your bench directory:
bench get-app https://github.com/oliver-nce/nce-studio
bench --site your-site.localhost install-app studio
```

### Development Install (local path)

```bash
bench get-app /path/to/studio
bench --site your-site.localhost install-app studio
bench build --app studio
```

---

## 🔧 Development

```bash
# Run migrations after schema changes
bench --site your-site.localhost migrate

# Rebuild JS/CSS assets
bench build --app studio

# Clear cache (do this after workspace JSON changes)
bench --site your-site.localhost clear-cache

# Run tests
bench --site your-site.localhost run-tests --app studio
```

---

## 🧪 Testing

```bash
# All tests
bench --site your-site.localhost run-tests --app studio

# Specific module
bench --site your-site.localhost run-tests --app studio --module nce_module

# Specific DocType
bench --site your-site.localhost run-tests --app studio --doctype "NCE Doctype"
```

---

## v15 / v16 Compatibility Notes

This template is designed to work on **both Frappe v15 and v16**. Key points:

- **`pyproject.toml`** declares `frappe >= 15.0.0, < 17.0.0`
- **`app_logo_url`** is set in `hooks.py` for v16's app landing page (ignored by v15)
- **Explicit `order_by`** should be used in all queries (v16 changed default sort)
- **`has_permission` hooks** must return `True` / `False` explicitly
- **JS uses `frappe.provide()`** for namespace safety (v16 uses IIFE isolation)
- **Route-agnostic** — no hardcoded `/app` or `/desk` paths

See `Frappe Context/v15_v16_compat.md` for the full compatibility guide.

---

## License

MIT — see [LICENSE](LICENSE)
``````
