# -*- coding: utf-8 -*-
"""
studio.api.theme_api
~~~~~~~~~~~~~~~~~~~~

Theme-related endpoints for NCE Studio.

Endpoints
---------
- get_theme_settings    — return NCE Theme Settings as a plain dict
- regenerate_theme_css  — trigger CSS file regeneration
"""

from __future__ import unicode_literals

import frappe


# ---------------------------------------------------------------------------
# get_theme_settings
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_theme_settings() -> dict:
    """Return the current NCE Theme Settings as a plain dict.

    Loads the singleton ``NCE Theme Settings`` record and delegates to
    its ``get_theme_variables()`` method.  If the record does not exist
    yet (first install), returns an empty dict so the frontend falls
    back to its built-in defaults.

    Returns:
        dict: All theme field values, or ``{}`` if not yet configured.
    """
    try:
        doc = frappe.get_single("NCE Theme Settings")
        return doc.get_theme_variables()
    except frappe.DoesNotExistError:
        return {}  # Theme settings not yet configured — use frontend defaults
    except Exception as exc:
        frappe.log_error(
            title="NCE get_theme_settings: failed to load theme",
            message=f"{type(exc).__name__}: {exc}",
        )
        return {}


# ---------------------------------------------------------------------------
# regenerate_theme_css
# ---------------------------------------------------------------------------


@frappe.whitelist()
def regenerate_theme_css() -> dict:
    """Trigger regeneration of the NCE theme CSS file.

    Loads the ``NCE Theme Settings`` singleton and calls its
    ``regenerate_theme_css()`` method.  Can be called from the frontend
    theme editor or from hooks (doc_events on NCE Theme Settings).

    Returns:
        dict: ``{ "status": "ok", "path": "..." }``
    """
    frappe.only_for("System Manager")

    try:
        doc = frappe.get_single("NCE Theme Settings")
        return doc.regenerate_theme_css()
    except Exception as exc:
        frappe.log_error(title="NCE regenerate_theme_css failed", message=str(exc))
        return {"status": "error", "message": str(exc)}
