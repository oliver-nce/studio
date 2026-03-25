# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe.tests.utils import FrappeTestCase


class TestNceDoctype(FrappeTestCase):
    """Unit tests for the NCE Doctype DocType.

    Run with:
        bench --site your-site.localhost run-tests --app studio --doctype "NCE Doctype"
    """

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for the entire test class."""
        super().setUpClass()
        # Create any shared test data here

    def tearDown(self):
        """Clean up after each test method."""
        frappe.db.rollback()

    # ------------------------------------------------------------------
    #  Helper factories
    # ------------------------------------------------------------------

    def _make_doc(
        self, title="Test Record", status="Open", description=None, do_not_save=False
    ):
        """Create a NCE Doctype document for testing.

        Args:
            title (str): Record title.
            status (str): Status value. Default "Open".
            description (str, optional): Description text.
            do_not_save (bool): If True, return unsaved doc.

        Returns:
            frappe.Document: The created (and optionally saved) document.
        """
        doc = frappe.get_doc(
            {
                "doctype": "NCE Doctype",
                "title": title,
                "status": status,
                "description": description,
            }
        )
        if not do_not_save:
            doc.insert()
        return doc

    # ------------------------------------------------------------------
    #  Tests — Creation
    # ------------------------------------------------------------------

    def test_create_record(self):
        """A record with valid data should be created successfully."""
        doc = self._make_doc(title="Unit Test Item")
        self.assertTrue(doc.name)
        self.assertEqual(doc.title, "Unit Test Item")
        self.assertEqual(doc.status, "Open")

    def test_default_status_is_open(self):
        """Status should default to 'Open' when not explicitly set."""
        doc = self._make_doc(title="Default Status Check")
        self.assertEqual(doc.status, "Open")

    # ------------------------------------------------------------------
    #  Tests — Validation
    # ------------------------------------------------------------------

    def test_title_is_required(self):
        """Inserting without a title should raise a validation error."""
        with self.assertRaises(frappe.exceptions.MandatoryError):
            self._make_doc(title=None)

    # ------------------------------------------------------------------
    #  Tests — Update
    # ------------------------------------------------------------------

    def test_update_status(self):
        """Status should be updatable to any valid option."""
        doc = self._make_doc(title="Status Update Test")
        doc.status = "In Progress"
        doc.save()
        doc.reload()
        self.assertEqual(doc.status, "In Progress")

    # ------------------------------------------------------------------
    #  Tests — Read (explicit order_by, v15/v16 safe)
    # ------------------------------------------------------------------

    def test_get_all_returns_records(self):
        """frappe.get_all should return created records with explicit order_by."""
        doc = self._make_doc(title="Findable Record")

        records = frappe.get_all(
            "NCE Doctype",
            filters={"name": doc.name},
            fields=["name", "title"],
            order_by="creation desc",  # Always explicit — v16 compat
        )
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].title, "Findable Record")

    # ------------------------------------------------------------------
    #  Tests — Delete
    # ------------------------------------------------------------------

    def test_delete_record(self):
        """A record should be deletable."""
        doc = self._make_doc(title="Deletable Record")
        name = doc.name
        doc.delete()
        self.assertFalse(frappe.db.exists("NCE Doctype", name))

    # ------------------------------------------------------------------
    #  Tests — Permissions (example; extend as needed)
    # ------------------------------------------------------------------

    def test_admin_can_read(self):
        """Administrator should have read access."""
        doc = self._make_doc(title="Permission Check")
        self.assertTrue(doc.has_permission("read"))
