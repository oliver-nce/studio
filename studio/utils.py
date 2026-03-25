# -*- coding: utf-8 -*-
"""
studio.utils
~~~~~~~~~~~~~

Shared utility functions for NCE Studio.

Includes centralised version-detection helpers so that v15/v16 conditional
logic is never scattered across the codebase.

Usage::

    from studio.utils import is_v16_or_later, get_frappe_major_version

    if is_v16_or_later():
        # v16-specific behaviour
        ...
"""

from __future__ import unicode_literals

import frappe
from frappe import _

# ---------------------------------------------------------------------------
#  Version Detection (centralised — single source of truth)
#
#  These helpers should be the ONLY place in the entire app that inspects
#  frappe.__version__.  All other modules should import from here.
#
#  Ref: Frappe Context / v15_v16_compat.md §4
# ---------------------------------------------------------------------------

_frappe_major_version = None  # cached after first call


def get_frappe_major_version():
    """Return the major version of the installed Frappe framework as an ``int``.

    The result is cached for the lifetime of the worker process.

    Returns:
        int: e.g. ``15`` or ``16``.
    """
    global _frappe_major_version
    if _frappe_major_version is None:
        _frappe_major_version = int(frappe.__version__.split(".")[0])
    return _frappe_major_version


def is_v16_or_later():
    """``True`` when running on Frappe v16 or newer.

    Returns:
        bool
    """
    return get_frappe_major_version() >= 16


def is_v15():
    """``True`` when running on Frappe v15 specifically.

    Returns:
        bool
    """
    return get_frappe_major_version() == 15


# ---------------------------------------------------------------------------
#  Role helpers
# ---------------------------------------------------------------------------


def is_system_manager(user=None):
    """``True`` when *user* (default: current session user) holds the
    System Manager role.

    Args:
        user (str | None): Frappe user ID.  Defaults to ``frappe.session.user``.

    Returns:
        bool
    """
    user = user or frappe.session.user
    return "System Manager" in frappe.get_roles(user)


# ---------------------------------------------------------------------------
#  Safe optional-module imports (lean-core guard)
#
#  Some modules that were built-in to v15 may be extracted to separate apps
#  in v16 (e.g. Newsletter, Energy Points, Blog).  Always guard imports.
#
#  Ref: Frappe Context / v15_v16_compat.md §9
# ---------------------------------------------------------------------------


def try_import(dotted_path):
    """Attempt to import *dotted_path* and return the module, or ``None``.

    Useful for guarding against lean-core removals in v16::

        Newsletter = try_import(
            "frappe.email.doctype.newsletter.newsletter.Newsletter"
        )
        if Newsletter is None:
            frappe.log_error("Newsletter module not available")

    Args:
        dotted_path (str): Fully-qualified Python import path.

    Returns:
        module | class | None: The imported object, or ``None`` on failure.
    """
    try:
        parts = dotted_path.rsplit(".", 1)
        if len(parts) == 2:
            module = __import__(parts[0], fromlist=[parts[1]])
            return getattr(module, parts[1], None)
        return __import__(dotted_path)
    except (ImportError, AttributeError):
        return None


# ---------------------------------------------------------------------------
#  Route helpers (v15 = /app, v16 = /desk — never hardcode)
# ---------------------------------------------------------------------------


def get_desk_route(*parts):
    """Build a Desk URL path that works on both v15 and v16.

    Args:
        *parts: Route segments, e.g. ``("Form", "NCE Doctype", "DOC-001")``.

    Returns:
        str: e.g. ``"/app/Form/NCE Doctype/DOC-001"`` on v15,
             ``"/desk/Form/NCE Doctype/DOC-001"`` on v16.
    """
    prefix = "/desk" if is_v16_or_later() else "/app"
    suffix = "/".join(str(p) for p in parts) if parts else ""
    if suffix:
        return f"{prefix}/{suffix}"
    return prefix


# ---------------------------------------------------------------------------
#  Query helpers (explicit ordering — v15/v16 safe)
# ---------------------------------------------------------------------------


def get_all_ordered(
    doctype,
    fields=None,
    filters=None,
    order_by="creation desc",
    limit_page_length=20,
    **kwargs,
):
    """Thin wrapper around ``frappe.get_all`` that enforces explicit ordering.

    v16 changed the default sort from ``modified desc`` to ``creation desc``.
    This helper makes the order_by parameter prominent and defaulted, so
    callers never rely on implicit framework behaviour.

    Args:
        doctype (str): DocType to query.
        fields (list | None): Field names to return.
        filters (dict | None): Frappe-style filters.
        order_by (str): SQL ORDER BY clause.  Default ``"creation desc"``.
        limit_page_length (int): Max rows.  Default ``20``.
        **kwargs: Passed through to ``frappe.get_all``.

    Returns:
        list[frappe._dict]: Query results.
    """
    return frappe.get_all(
        doctype,
        fields=fields,
        filters=filters,
        order_by=order_by,
        limit_page_length=limit_page_length,
        **kwargs,
    )


# ---------------------------------------------------------------------------
#  Permission helpers (v15/v16 safe — always return explicit bool)
# ---------------------------------------------------------------------------


def check_permission(doctype, ptype="read", doc=None, throw=False):
    """Check whether the current user has *ptype* permission on *doctype*.

    Always returns an explicit ``True`` / ``False`` (never ``None``), which
    is required for v16 compatibility.

    Args:
        doctype (str): DocType name.
        ptype (str): Permission type — ``"read"``, ``"write"``, ``"create"``, etc.
        doc (str | None): Specific document name, or ``None`` for DocType-level check.
        throw (bool): If ``True``, raise ``frappe.PermissionError`` on failure.

    Returns:
        bool
    """
    try:
        frappe.has_permission(doctype, ptype=ptype, doc=doc, throw=throw)
        return True
    except frappe.PermissionError:
        return False


# ---------------------------------------------------------------------------
#  Formatting / display helpers
# ---------------------------------------------------------------------------


def get_app_version():
    """Return the current version string of studio.

    Returns:
        str: e.g. ``"0.0.1"``.
    """
    from studio import __version__

    return __version__
