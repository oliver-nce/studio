# NCE Studio

A Frappe app built on top of Frappe Studio, extending it with NCE-specific components, APIs, and a full theme system.

---

## Installation

```bash
bench get-app https://github.com/oliver-nce/studio
bench --site your-site install-app studio
```

---

## Development

```bash
# After schema changes
bench --site your-site migrate

# Rebuild assets
bench build --app studio

# Clear cache
bench --site your-site clear-cache

# Run tests
bench --site your-site run-tests --app studio
```

---

## License

MIT — see [LICENSE](LICENSE)