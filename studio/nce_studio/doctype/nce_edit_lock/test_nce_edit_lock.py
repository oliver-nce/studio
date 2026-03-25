# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe.utils import add_to_date, now_datetime

from studio.tests.test_utils import NceStudioTestCase, cleanup_test_records


class TestNCEEditLock(NceStudioTestCase):
    """Unit tests for the NCE Edit Lock DocType.

    Run with:
        bench --site your-site.localhost run-tests --app studio --doctype "NCE Edit Lock"
    """

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for the entire test class."""
        super().setUpClass()
        # Create test users if they don't exist
        cls.test_user = "test_edit_lock_user@example.com"
        cls.other_user = "other_edit_lock_user@example.com"

        for email in [cls.test_user, cls.other_user]:
            if not frappe.db.exists("User", email):
                user = frappe.get_doc(
                    {
                        "doctype": "User",
                        "email": email,
                        "first_name": email.split("@")[0],
                    }
                )
                user.insert(ignore_permissions=True)

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests in this class."""
        super().tearDownClass()
        cleanup_test_records("NCE Edit Lock")

    def setUp(self):
        """Set up before each test method."""
        super().setUp()
        # Default to the first test user
        self.original_user = frappe.session.user
        frappe.set_user(self.test_user)

    def tearDown(self):
        """Clean up after each test method."""
        frappe.set_user(self.original_user)
        super().tearDown()

    # ------------------------------------------------------------------
    #  Helper factories
    # ------------------------------------------------------------------

    def _make_lock(
        self,
        target_doctype="User",
        target_docname="Administrator",
        locked_by=None,
        locked_at=None,
        expires_at=None,
        do_not_save=False,
    ):
        """Create an NCE Edit Lock document for testing.

        Args:
            target_doctype (str): Target DocType.
            target_docname (str): Target document name.
            locked_by (str, optional): User who holds the lock.
            locked_at (datetime, optional): When lock was acquired.
            expires_at (datetime, optional): When lock expires.
            do_not_save (bool): If True, return unsaved doc.

        Returns:
            frappe.Document: The created (and optionally saved) document.
        """
        doc = frappe.get_doc(
            {
                "doctype": "NCE Edit Lock",
                "target_doctype": target_doctype,
                "target_docname": target_docname,
                "locked_by": locked_by,
                "locked_at": locked_at,
                "expires_at": expires_at,
            }
        )
        if not do_not_save:
            doc.insert(ignore_permissions=True)
        return doc

    # ------------------------------------------------------------------
    #  Tests — is_expired()
    # ------------------------------------------------------------------

    def test_is_expired_returns_true_when_past(self):
        """is_expired() should return True when expires_at is in the past."""
        now = now_datetime()
        past = add_to_date(now, minutes=-5)

        lock = self._make_lock(expires_at=past)
        self.assertTrue(lock.is_expired(), "Lock with past expiry should be expired")

    def test_is_expired_returns_false_when_future(self):
        """is_expired() should return False when expires_at is in the future."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(expires_at=future)
        self.assertFalse(lock.is_expired(), "Lock with future expiry should not be expired")

    def test_is_expired_returns_false_when_not_set(self):
        """is_expired() should return False when expires_at is None."""
        lock = self._make_lock(expires_at=None)
        self.assertFalse(lock.is_expired(), "Lock without expiry should not be expired")

    # ------------------------------------------------------------------
    #  Tests — validate()
    # ------------------------------------------------------------------

    def test_validate_allows_own_lock_modification(self):
        """A user should be able to modify their own lock."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=now,
            expires_at=future,
        )

        # Should not raise
        lock.validate()

    def test_validate_prevents_modifying_others_lock(self):
        """A non-System Manager should not be able to modify another user's lock."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            locked_by=self.other_user,
            locked_at=now,
            expires_at=future,
        )

        with self.assertRaises(frappe.PermissionError):
            lock.validate()

    def test_validate_allows_system_manager_to_modify_others_lock(self):
        """A System Manager should be able to modify any lock."""
        # Switch to System Manager
        frappe.set_user("Administrator")

        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            locked_by=self.other_user,
            locked_at=now,
            expires_at=future,
        )

        # Should not raise
        lock.validate()

        # Switch back to test user
        frappe.set_user(self.test_user)

    def test_validate_warns_on_expired_lock(self):
        """validate() should warn if lock is already expired."""
        now = now_datetime()
        past = add_to_date(now, minutes=-5)

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=past,
            expires_at=past,
        )

        # Should not raise, but should warn
        lock.validate()

    # ------------------------------------------------------------------
    #  Tests — release()
    # ------------------------------------------------------------------

    def test_release_clears_lock_fields(self):
        """release() should clear locked_by, locked_at, and expires_at."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=now,
            expires_at=future,
        )

        lock.release()

        self.assertIsNone(lock.locked_by, "locked_by should be cleared")
        self.assertIsNone(lock.locked_at, "locked_at should be cleared")
        self.assertIsNone(lock.expires_at, "expires_at should be cleared")

    def test_release_saves_document(self):
        """release() should save the document."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            target_doctype="User",
            target_docname="Administrator",
            locked_by=self.test_user,
            locked_at=now,
            expires_at=future,
        )

        lock.release()

        # Reload from DB to verify it was saved
        reloaded = frappe.get_doc("NCE Edit Lock", lock.name)
        self.assertIsNone(reloaded.locked_by, "locked_by should be None in DB")
        self.assertIsNone(reloaded.locked_at, "locked_at should be None in DB")
        self.assertIsNone(reloaded.expires_at, "expires_at should be None in DB")

    # ------------------------------------------------------------------
    #  Tests — renew()
    # ------------------------------------------------------------------

    def test_renew_extends_expiry(self):
        """renew() should extend the expiry time."""
        now = now_datetime()
        old_future = add_to_date(now, minutes=5)

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=now,
            expires_at=old_future,
        )

        # Renew for 15 more minutes
        lock.renew(duration_minutes=15)

        # New expiry should be roughly 15 minutes from now
        new_future = add_to_date(now_datetime(), minutes=15)
        time_diff = abs((lock.expires_at - new_future).total_seconds())

        self.assertLess(
            time_diff,
            60,  # Within 60 seconds (accounting for test execution time)
            "Renewed expiry should be ~15 minutes from now",
        )

    def test_renew_updates_locked_at(self):
        """renew() should update locked_at to the current time."""
        now = now_datetime()
        old_time = add_to_date(now, minutes=-10)

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=old_time,
            expires_at=add_to_date(old_time, minutes=15),
        )

        lock.renew(duration_minutes=15)

        time_diff = abs((lock.locked_at - now_datetime()).total_seconds())
        self.assertLess(
            time_diff,
            5,  # Within 5 seconds
            "locked_at should be updated to current time",
        )

    def test_renew_saves_document(self):
        """renew() should save the document."""
        now = now_datetime()
        future = add_to_date(now, minutes=15)

        lock = self._make_lock(
            target_doctype="User",
            target_docname="Administrator",
            locked_by=self.test_user,
            locked_at=now,
            expires_at=future,
        )

        lock.renew(duration_minutes=20)

        # Reload from DB to verify it was saved
        reloaded = frappe.get_doc("NCE Edit Lock", lock.name)
        self.assertIsNotNone(reloaded.locked_at, "locked_at should be set in DB")
        self.assertIsNotNone(reloaded.expires_at, "expires_at should be set in DB")

    def test_renew_with_custom_duration(self):
        """renew() should respect custom duration_minutes parameter."""
        now = now_datetime()

        lock = self._make_lock(
            locked_by=self.test_user,
            locked_at=now,
            expires_at=add_to_date(now, minutes=15),
        )

        lock.renew(duration_minutes=30)

        # New expiry should be roughly 30 minutes from now
        new_future = add_to_date(now_datetime(), minutes=30)
        time_diff = abs((lock.expires_at - new_future).total_seconds())

        self.assertLess(
            time_diff,
            60,  # Within 60 seconds
            "Renewed expiry should be ~30 minutes from now",
        )
