# -*- coding: utf-8 -*-
"""
studio.api.nce_api
~~~~~~~~~~~~~~~~~~

All NCE Studio whitelisted API endpoints.

Endpoints
---------
- resolve_fields          — read data through link chains
- save_resolved_fields    — write data back through link chains
- check_edit_lock         — check if a record is locked
- acquire_edit_lock       — acquire an edit lock for the current user
- release_edit_lock       — release the current user's lock
- refresh_edit_lock       — extend an existing lock's expiry
- get_random_doc_name     — return a random document name for a DocType
- get_theme_settings      — return NCE Theme Settings as a plain dict
- regenerate_theme_css    — trigger CSS file regeneration
"""

from __future__ import unicode_literals

import random

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime

# ---------------------------------------------------------------------------
# 1. resolve_fields
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
# 2. save_resolved_fields
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
# 3. check_edit_lock
# ---------------------------------------------------------------------------


@frappe.whitelist()
def check_edit_lock(doctype: str, docname: str) -> dict:
    """Check whether a record currently has an active edit lock.

    Args:
        doctype (str): Target DocType.
        docname (str): Target document name.

    Returns:
        dict: ``{ "locked": false }``
              or ``{ "locked": true, "locked_by": ..., "locked_at": ...,
                     "expires_at": ... }``
    """
    frappe.has_permission(doctype, "read", docname, throw=True)

    filters = {"target_doctype": doctype, "target_docname": docname}
    lock_name = frappe.db.get_value("NCE Edit Lock", filters, "name")

    if not lock_name:
        return {"locked": False}

    lock = frappe.get_doc("NCE Edit Lock", lock_name)

    if lock.is_expired():
        # Stale lock — clean it up opportunistically
        try:
            frappe.delete_doc("NCE Edit Lock", lock_name, ignore_permissions=True)
        except frappe.DoesNotExistError:
            pass  # Already deleted by another request
        except Exception as exc:
            frappe.log_error(
                title="NCE check_edit_lock: failed to clean up expired lock",
                message=f"lock={lock_name}: {type(exc).__name__}: {exc}",
            )
        return {"locked": False}

    return {
        "locked": True,
        "locked_by": lock.locked_by,
        "locked_at": str(lock.locked_at),
        "expires_at": str(lock.expires_at),
    }


# ---------------------------------------------------------------------------
# 4. acquire_edit_lock
# ---------------------------------------------------------------------------


@frappe.whitelist()
def acquire_edit_lock(doctype: str, docname: str, duration_minutes: int = 15) -> dict:
    """Acquire an edit lock on a record for the current user.

    If the record is already locked by another user, a conflict response
    is returned rather than raising an exception, so the frontend can
    display a user-friendly message.

    Args:
        doctype (str): Target DocType.
        docname (str): Target document name.
        duration_minutes (int): Lock TTL in minutes. Defaults to 15.

    Returns:
        dict: ``{ "locked": true, "locked_by": ..., "expires_at": ... }``
              or ``{ "status": "conflict", "locked_by": ..., "expires_at": ... }``
    """
    frappe.has_permission(doctype, "write", docname, throw=True)

    existing = check_edit_lock(doctype, docname)
    if existing.get("locked") and existing.get("locked_by") != frappe.session.user:
        return {
            "status": "conflict",
            "locked_by": existing["locked_by"],
            "expires_at": existing["expires_at"],
            "message": _("This record is currently locked by {0}.").format(
                existing["locked_by"]
            ),
        }

    now = now_datetime()
    expires = add_to_date(now, minutes=int(duration_minutes))
    filters = {"target_doctype": doctype, "target_docname": docname}

    # Use SELECT FOR UPDATE to prevent race conditions between concurrent
    # lock acquisition requests on the same document.
    lock_name = frappe.db.sql(
        """SELECT name FROM `tabNCE Edit Lock`
        WHERE target_doctype = %s AND target_docname = %s
        FOR UPDATE""",
        (doctype, docname),
    )
    lock_name = lock_name[0][0] if lock_name else None

    if lock_name:
        lock = frappe.get_doc("NCE Edit Lock", lock_name)
        lock.locked_by = frappe.session.user
        lock.locked_at = now
        lock.expires_at = expires
        lock.save(ignore_permissions=True)
    else:
        lock = frappe.get_doc(
            {
                "doctype": "NCE Edit Lock",
                "target_doctype": doctype,
                "target_docname": docname,
                "locked_by": frappe.session.user,
                "locked_at": now,
                "expires_at": expires,
            }
        )
        lock.insert(ignore_permissions=True)

    frappe.db.commit()

    return {
        "locked": True,
        "locked_by": frappe.session.user,
        "locked_at": str(now),
        "expires_at": str(expires),
    }


# ---------------------------------------------------------------------------
# 5. release_edit_lock
# ---------------------------------------------------------------------------


@frappe.whitelist()
def release_edit_lock(doctype: str, docname: str) -> dict:
    """Release the current user's edit lock on a record.

    System Managers can release any lock.  Regular users may only release
    locks they themselves hold.

    Args:
        doctype (str): Target DocType.
        docname (str): Target document name.

    Returns:
        dict: ``{ "released": true }`` or ``{ "released": false, "reason": ... }``
    """
    frappe.has_permission(doctype, "read", docname, throw=True)

    filters = {"target_doctype": doctype, "target_docname": docname}
    lock_name = frappe.db.get_value("NCE Edit Lock", filters, "name")

    if not lock_name:
        return {"released": True}  # Nothing to release

    lock = frappe.get_doc("NCE Edit Lock", lock_name)
    is_system_manager = "System Manager" in frappe.get_roles(frappe.session.user)

    if not is_system_manager and lock.locked_by != frappe.session.user:
        return {
            "released": False,
            "reason": _("Lock is held by {0}.").format(lock.locked_by),
        }

    frappe.delete_doc("NCE Edit Lock", lock_name, ignore_permissions=True)
    frappe.db.commit()

    return {"released": True}


# ---------------------------------------------------------------------------
# 6. refresh_edit_lock
# ---------------------------------------------------------------------------


@frappe.whitelist()
def refresh_edit_lock(doctype: str, docname: str, duration_minutes: int = 15) -> dict:
    """Extend an existing edit lock's expiry time.

    Useful for long-running edits: the frontend can call this periodically
    to prevent the lock from expiring mid-session.

    Args:
        doctype (str): Target DocType.
        docname (str): Target document name.
        duration_minutes (int): New TTL in minutes from now. Defaults to 15.

    Returns:
        dict: Updated lock state, same shape as ``acquire_edit_lock``.
    """
    frappe.has_permission(doctype, "write", docname, throw=True)

    filters = {"target_doctype": doctype, "target_docname": docname}
    lock_name = frappe.db.get_value("NCE Edit Lock", filters, "name")

    if not lock_name:
        # No existing lock — just acquire one
        return acquire_edit_lock(doctype, docname, duration_minutes)

    lock = frappe.get_doc("NCE Edit Lock", lock_name)
    is_system_manager = "System Manager" in frappe.get_roles(frappe.session.user)

    if not is_system_manager and lock.locked_by != frappe.session.user:
        return {
            "status": "conflict",
            "locked_by": lock.locked_by,
            "message": _("Cannot refresh a lock held by {0}.").format(lock.locked_by),
        }

    now = now_datetime()
    expires = add_to_date(now, minutes=int(duration_minutes))
    lock.locked_at = now
    lock.expires_at = expires
    lock.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "locked": True,
        "locked_by": lock.locked_by,
        "locked_at": str(now),
        "expires_at": str(expires),
    }


# ---------------------------------------------------------------------------
# 7. get_random_doc_name
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


# ---------------------------------------------------------------------------
# 8. get_theme_settings
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
# 9. regenerate_theme_css
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
