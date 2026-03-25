# -*- coding: utf-8 -*-
"""
NCE Edit Lock — Frappe Document Controller

Manages collaborative edit locking for NCE Studio form pages.
A lock record is created when a user begins editing a document,
preventing other users from overwriting concurrent changes.
"""

from __future__ import unicode_literals

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, now_datetime


class NCEEditLock(Document):
    # ------------------------------------------------------------------
    # Lifecycle hooks
    # ------------------------------------------------------------------

    def validate(self):
        """Validate the lock record before saving."""
        self._validate_not_expired()
        self._validate_locked_by()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _validate_not_expired(self):
        """Warn (but do not block) if saving an already-expired lock."""
        if self.expires_at and self.is_expired():
            frappe.msgprint(
                _("This edit lock has already expired ({0}).").format(self.expires_at),
                alert=True,
            )

    def _validate_locked_by(self):
        """Ensure locked_by is either empty or matches the session user,
        unless the current user is a System Manager."""
        if not self.locked_by:
            return
        is_system_manager = "System Manager" in frappe.get_roles(frappe.session.user)
        if not is_system_manager and self.locked_by != frappe.session.user:
            frappe.throw(
                _("You cannot modify a lock held by '{0}'.").format(self.locked_by),
                title=_("Permission Denied"),
            )

    # ------------------------------------------------------------------
    # Public instance methods
    # ------------------------------------------------------------------

    def is_expired(self) -> bool:
        """Return True if the lock's expiry time has passed.

        Returns:
            bool: True if expires_at is set and is in the past.
        """
        if not self.expires_at:
            return False
        return now_datetime() > frappe.utils.get_datetime(self.expires_at)

    def release(self):
        """Clear lock fields and save.

        Removes locked_by, locked_at, and expires_at, effectively
        releasing the lock without deleting the record.
        """
        self.locked_by = None
        self.locked_at = None
        self.expires_at = None
        self.save(ignore_permissions=True)

    def renew(self, duration_minutes: int = 15):
        """Extend the lock expiry by the given number of minutes.

        Args:
            duration_minutes (int): How many minutes from now the lock
                should expire. Defaults to 15.
        """
        now = now_datetime()
        self.locked_at = now
        self.expires_at = add_to_date(now, minutes=duration_minutes)
        self.save(ignore_permissions=True)
