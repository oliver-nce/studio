# -*- coding: utf-8 -*-
"""
studio.api.lock_api
~~~~~~~~~~~~~~~~~~~

Edit-lock endpoints for NCE Studio.

Endpoints
---------
- check_edit_lock    — check if a record is locked
- acquire_edit_lock  — acquire an edit lock for the current user
- release_edit_lock  — release the current user's lock
- refresh_edit_lock  — extend an existing lock's expiry
"""

from __future__ import unicode_literals

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime

from studio.utils import is_system_manager


# ---------------------------------------------------------------------------
# check_edit_lock
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
# acquire_edit_lock
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
# release_edit_lock
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
    _is_sm = is_system_manager()

    if not _is_sm and lock.locked_by != frappe.session.user:
        return {
            "released": False,
            "reason": _("Lock is held by {0}.").format(lock.locked_by),
        }

    frappe.delete_doc("NCE Edit Lock", lock_name, ignore_permissions=True)
    frappe.db.commit()

    return {"released": True}


# ---------------------------------------------------------------------------
# refresh_edit_lock
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
    _is_sm = is_system_manager()

    if not _is_sm and lock.locked_by != frappe.session.user:
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
