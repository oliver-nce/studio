# -*- coding: utf-8 -*-
"""
Studio API — public endpoints.

This __init__.py exposes @frappe.whitelist() functions that the frontend
resolves as ``studio.api.<function_name>``.

Sub-modules (nce_api, field_api, lock_api, theme_api) are imported below
so that their endpoints remain reachable at their fully-qualified paths
(e.g. ``studio.api.nce_api.get_nce_doctypes``).
"""

from __future__ import unicode_literals

import frappe
from frappe import _

# ---------------------------------------------------------------------------
#  Re-export sub-module endpoints for discoverability
# ---------------------------------------------------------------------------
from studio.api import (
    field_api,  # noqa: F401
    lock_api,  # noqa: F401
    nce_api,  # noqa: F401
    theme_api,  # noqa: F401
)


# ---------------------------------------------------------------------------
#  App-level permission check (called by frontend on every page load)
# ---------------------------------------------------------------------------
@frappe.whitelist()
def check_app_permission() -> bool:
    """Return True if the current user may access Studio."""
    if frappe.session.user == "Administrator":
        return True

    # Studio App and Studio Page are the core DocTypes that gate access.
    # If neither exists yet (fresh install), fall back to System Manager role.
    try:
        has_app = frappe.has_permission("Studio App", ptype="write")
        has_page = frappe.has_permission("Studio Page", ptype="write")
        if has_app and has_page:
            return True
    except frappe.DoesNotExistError:
        pass

    # Fallback: allow System Managers
    if "System Manager" in frappe.get_roles(frappe.session.user):
        return True

    return False


# ---------------------------------------------------------------------------
#  Component discovery (used by the Studio canvas)
# ---------------------------------------------------------------------------
@frappe.whitelist()
def get_app_components(app_name: str, field: str = "blocks") -> list[str]:
    """Return the list of component names registered in a Studio App."""
    import re

    if field not in ("blocks", "draft_blocks"):
        frappe.throw(_("Invalid field: {0}").format(field))

    app = frappe.get_doc("Studio App", app_name)
    raw = app.get(field) or "[]"

    # The field stores a JSON array of component file paths.
    try:
        import json

        components = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        components = []

    return components


# ---------------------------------------------------------------------------
#  Misc helpers expected by the frontend
# ---------------------------------------------------------------------------
@frappe.whitelist()
def get_doctype_fields(doctype: str) -> list[dict]:
    """Return field metadata for a given DocType (used by data bindings)."""
    frappe.has_permission(doctype, throw=True)

    meta = frappe.get_meta(doctype)
    fields = []
    for field in meta.fields:
        if field.fieldtype in (
            "Section Break",
            "Column Break",
            "Tab Break",
            "HTML",
        ):
            continue
        fields.append(
            {
                "fieldname": field.fieldname,
                "fieldtype": field.fieldtype,
                "label": _(field.label or field.fieldname),
                "value": field.fieldname,
                "options": field.options,
                "reqd": field.reqd,
            }
        )
    return fields


@frappe.whitelist(allow_guest=True)
def get_studio_page(route: str) -> dict:
    """Fetch a published Studio Page by its route (public endpoint for renderers)."""
    page_name = frappe.db.get_value(
        "Studio Page", {"route": route, "published": 1}, "name"
    )
    if not page_name:
        frappe.throw(_("Page not found"), frappe.DoesNotExistError)

    doc = frappe.get_doc("Studio Page", page_name)
    return {
        "name": doc.name,
        "page_title": doc.page_title,
        "route": doc.route,
        "blocks": doc.blocks,
        "draft_blocks": doc.draft_blocks,
        "published": doc.published,
    }
