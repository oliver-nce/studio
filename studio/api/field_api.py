# -*- coding: utf-8 -*-
"""
studio.api.field_api
~~~~~~~~~~~~~~~~~~~~

Field-resolution and document-utility endpoints for NCE Studio.

Endpoints
---------
- resolve_fields        — read data through link chains
- save_resolved_fields  — write data back through link chains
- get_random_doc_name   — return a random document name for a DocType
"""

from __future__ import unicode_literals

import random

import frappe
from frappe import _


# ---------------------------------------------------------------------------
# resolve_fields
# ---------------------------------------------------------------------------


@frappe.whitelist()
def resolve_fields(doctype: str, docname: str, field_paths) -> dict:
    """Read one or more field values from a document, following link chains.

    Supports dot-notation paths (e.g. ``"customer.customer_group.name"``).
    Intermediate link fields are followed transparently.  Child-table
    (Table) fields return a list of row dicts.

    Args:
        doctype (str): Root DocType name.
        docname (str): Root document name.
        field_paths (list[str] | str): One or more dot-notation field paths.
            Accepts a JSON-encoded string or a Python list.

    Returns:
        dict: ``{ "<field_path>": <resolved_value>, ... }``
    """
    if isinstance(field_paths, str):
        import json

        field_paths = json.loads(field_paths)

    frappe.has_permission(doctype, "read", docname, throw=True)

    # Cache docs fetched during this request to avoid redundant DB hits.
    doc_cache: dict[tuple[str, str], frappe.model.document.Document] = {}

    def get_doc(dt: str, dn: str):
        key = (dt, dn)
        if key not in doc_cache:
            doc_cache[key] = frappe.get_doc(dt, dn)
        return doc_cache[key]

    def get_meta_fields(dt: str) -> dict:
        """Return fieldname → meta field dict for a DocType."""
        meta = frappe.get_meta(dt)
        return {f.fieldname: f for f in meta.fields}

    def resolve_path(path: str):
        """Walk a dot-notation path and return the terminal value."""
        segments = path.split(".")
        current_dt = doctype
        current_dn = docname

        for i, segment in enumerate(segments):
            is_last = i == len(segments) - 1
            meta_fields = get_meta_fields(current_dt)
            field_meta = meta_fields.get(segment)

            if field_meta is None:
                # Unknown field — return None gracefully
                return None

            doc = get_doc(current_dt, current_dn)

            if is_last:
                # Terminal segment — return the raw value
                if field_meta.fieldtype == "Table":
                    # Return list of child-row dicts
                    rows = doc.get(segment) or []
                    return [row.as_dict() for row in rows]
                return doc.get(segment)

            # Intermediate segment — must be a Link field
            if field_meta.fieldtype == "Link":
                linked_doctype = field_meta.options
                linked_docname = doc.get(segment)
                if not linked_docname:
                    # Broken link — cannot continue the chain
                    return None
                # Check read permission on the linked document
                frappe.has_permission(
                    linked_doctype, "read", linked_docname, throw=True
                )
                current_dt = linked_doctype
                current_dn = linked_docname
            else:
                # Non-link intermediate field — cannot traverse further
                return None

        return None

    result = {}
    for path in field_paths:
        try:
            result[path] = resolve_path(path)
        except frappe.PermissionError:
            result[path] = None
        except frappe.DoesNotExistError:
            result[path] = None
        except (ValueError, KeyError, TypeError) as exc:
            frappe.log_error(
                title=f"NCE resolve_fields: data error for path '{path}'",
                message=f"doctype={doctype} docname={docname}: {exc}",
            )
            result[path] = None
        except Exception as exc:
            frappe.log_error(
                title=f"NCE resolve_fields: unexpected error for path '{path}'",
                message=f"doctype={doctype} docname={docname}: {type(exc).__name__}: {exc}",
            )
            result[path] = None

    return result


# ---------------------------------------------------------------------------
# save_resolved_fields
# ---------------------------------------------------------------------------


@frappe.whitelist()
def save_resolved_fields(
    doctype: str,
    docname: str,
    field_values,
    lock_token: str | None = None,
) -> dict:
    """Write field values back to a document, following link chains.

    Supports the same dot-notation paths as ``resolve_fields``.  Each
    unique target document is saved exactly once after all its fields
    have been updated.

    Args:
        doctype (str): Root DocType name.
        docname (str): Root document name.
        field_values (dict | str): ``{ "<field_path>": <new_value>, ... }``
            Accepts a JSON-encoded string or a Python dict.
        lock_token (str | None): If provided, the current user must hold
            the edit lock for ``(doctype, docname)`` or an error is raised.

    Returns:
        dict: ``{ "status": "ok", "updated_docs": [<dt>/<dn>, ...] }``
              or ``{ "status": "conflict", "message": "..." }``
    """
    if isinstance(field_values, str):
        import json

        field_values = json.loads(field_values)

    frappe.has_permission(doctype, "write", docname, throw=True)

    # Validate edit lock if a token was supplied
    if lock_token:
        from studio.api.lock_api import check_edit_lock

        lock_info = check_edit_lock(doctype, docname)
        if lock_info.get("locked"):
            if lock_info.get("locked_by") != frappe.session.user:
                return {
                    "status": "conflict",
                    "message": _("This record is currently locked by {0}.").format(
                        lock_info.get("locked_by")
                    ),
                }
            # Verify the supplied token matches the lock holder
            if lock_token != lock_info.get("locked_by"):
                return {
                    "status": "conflict",
                    "message": _("Lock token does not match. The lock may have been re-acquired."),
                }
        else:
            # lock_token was supplied but no lock exists — warn caller
            return {
                "status": "conflict",
                "message": _("Edit lock has expired. Please re-acquire the lock before saving."),
            }

    doc_cache: dict[tuple[str, str], frappe.model.document.Document] = {}

    def get_doc(dt: str, dn: str):
        key = (dt, dn)
        if key not in doc_cache:
            doc_cache[key] = frappe.get_doc(dt, dn)
        return doc_cache[key]

    def get_meta_fields(dt: str) -> dict:
        meta = frappe.get_meta(dt)
        return {f.fieldname: f for f in meta.fields}

    # Accumulate writes: (target_dt, target_dn) → { fieldname: value }
    pending: dict[tuple[str, str], dict] = {}

    for path, value in field_values.items():
        segments = path.split(".")
        current_dt = doctype
        current_dn = docname
        resolved = True

        for i, segment in enumerate(segments):
            is_last = i == len(segments) - 1
            meta_fields = get_meta_fields(current_dt)
            field_meta = meta_fields.get(segment)

            if field_meta is None:
                resolved = False
                break

            if is_last:
                key = (current_dt, current_dn)
                if key not in pending:
                    pending[key] = {}
                pending[key][segment] = value
            else:
                if field_meta.fieldtype != "Link":
                    resolved = False
                    break
                doc = get_doc(current_dt, current_dn)
                linked_doctype = field_meta.options
                linked_docname = doc.get(segment)
                if not linked_docname:
                    resolved = False
                    break
                current_dt = linked_doctype
                current_dn = linked_docname

        if not resolved:
            frappe.log_error(
                title=f"NCE save_resolved_fields: could not resolve path '{path}'",
                message=f"doctype={doctype} docname={docname}",
            )

    # Now apply all pending writes and save each document once
    updated = []
    for (target_dt, target_dn), fields in pending.items():
        doc = get_doc(target_dt, target_dn)
        for fieldname, value in fields.items():
            doc.set(fieldname, value)
        doc.save()
        updated.append(f"{target_dt}/{target_dn}")

    return {"status": "ok", "updated_docs": updated}


# ---------------------------------------------------------------------------
# get_random_doc_name
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_random_doc_name(doctype: str) -> str | None:
    """Return a random document name for a given DocType.

    Used by the form runtime's record selector to provide a sensible
    default document when opening a form for the first time.

    Args:
        doctype (str): DocType to query.

    Returns:
        str | None: A random document name, or None if no documents exist.
    """
    frappe.has_permission(doctype, "read", throw=True)

    names = frappe.get_all(
        doctype,
        pluck="name",
        limit_page_length=100,
        order_by="creation desc",
    )

    if not names:
        return None

    return random.choice(names)
