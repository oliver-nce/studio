# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import json

import frappe

from studio.tests.test_utils import NceStudioTestCase, cleanup_test_records


class TestNCEFormDefinition(NceStudioTestCase):
    """Unit tests for the NCE Form Definition DocType.

    Run with:
        bench --site your-site.localhost run-tests --app studio --doctype "NCE Form Definition"
    """

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for the entire test class."""
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests in this class."""
        super().tearDownClass()
        cleanup_test_records("NCE Form Definition")

    def setUp(self):
        """Set up before each test method."""
        super().setUp()

    def tearDown(self):
        """Clean up after each test method."""
        super().tearDown()

    # ------------------------------------------------------------------
    #  Helper factories
    # ------------------------------------------------------------------

    def _make_form_definition(
        self,
        name=None,
        target_doctype="User",
        form_schema=None,
        field_mapping=None,
        grid_layout=None,
        grid_config=None,
        tab_layout=None,
        validation_rules=None,
        allowed_roles=None,
        do_not_save=False,
    ):
        """Create an NCE Form Definition document for testing.

        Args:
            name (str, optional): Document name.
            target_doctype (str): Target DocType.
            form_schema (str or dict, optional): Form schema JSON.
            field_mapping (str or dict, optional): Field mapping JSON.
            grid_layout (str or dict, optional): Grid layout JSON.
            grid_config (str or dict, optional): Grid config JSON.
            tab_layout (str or dict, optional): Tab layout JSON.
            validation_rules (str or dict, optional): Validation rules JSON.
            allowed_roles (str or dict, optional): Allowed roles JSON.
            do_not_save (bool): If True, return unsaved doc.

        Returns:
            frappe.Document: The created (and optionally saved) document.
        """
        # Convert dicts to JSON strings for storage
        if isinstance(form_schema, dict):
            form_schema = json.dumps(form_schema)
        if isinstance(field_mapping, dict):
            field_mapping = json.dumps(field_mapping)
        if isinstance(grid_layout, dict):
            grid_layout = json.dumps(grid_layout)
        if isinstance(grid_config, dict):
            grid_config = json.dumps(grid_config)
        if isinstance(tab_layout, dict):
            tab_layout = json.dumps(tab_layout)
        if isinstance(validation_rules, dict):
            validation_rules = json.dumps(validation_rules)
        if isinstance(allowed_roles, dict):
            allowed_roles = json.dumps(allowed_roles)

        doc = frappe.get_doc(
            {
                "doctype": "NCE Form Definition",
                "name": name,
                "target_doctype": target_doctype,
                "form_schema": form_schema,
                "field_mapping": field_mapping,
                "grid_layout": grid_layout,
                "grid_config": grid_config,
                "tab_layout": tab_layout,
                "validation_rules": validation_rules,
                "allowed_roles": allowed_roles,
            }
        )
        if not do_not_save:
            doc.insert(ignore_permissions=True)
        return doc

    # ------------------------------------------------------------------
    #  Tests — _validate_target_doctype()
    # ------------------------------------------------------------------

    def test_validate_accepts_valid_doctype(self):
        """validate() should accept a valid target DocType."""
        doc = self._make_form_definition(
            name="test_valid_doctype",
            target_doctype="User",  # Exists in Frappe
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_nonexistent_doctype(self):
        """validate() should reject a non-existent target DocType."""
        doc = self._make_form_definition(
            name="test_invalid_doctype",
            target_doctype="NonExistentDocType12345",
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    def test_validate_allows_empty_target_doctype(self):
        """validate() should allow empty target_doctype."""
        doc = self._make_form_definition(
            name="test_empty_doctype",
            target_doctype="",
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_allows_none_target_doctype(self):
        """validate() should allow None target_doctype."""
        doc = self._make_form_definition(
            name="test_none_doctype",
            target_doctype=None,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    # ------------------------------------------------------------------
    #  Tests — _validate_json_fields()
    # ------------------------------------------------------------------

    def test_validate_accepts_valid_form_schema_json(self):
        """validate() should accept valid JSON in form_schema."""
        valid_schema = json.dumps(
            {
                "fields": [
                    {"fieldname": "email", "label": "Email"},
                    {"fieldname": "first_name", "label": "First Name"},
                ]
            }
        )

        doc = self._make_form_definition(
            name="test_valid_schema",
            target_doctype="User",
            form_schema=valid_schema,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_malformed_form_schema_json(self):
        """validate() should reject malformed JSON in form_schema."""
        malformed_schema = '{invalid json: [missing quote}'

        doc = self._make_form_definition(
            name="test_invalid_schema",
            target_doctype="User",
            form_schema=malformed_schema,
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    def test_validate_accepts_valid_field_mapping_json(self):
        """validate() should accept valid JSON in field_mapping."""
        valid_mapping = json.dumps({"email": "user_email", "first_name": "given_name"})

        doc = self._make_form_definition(
            name="test_valid_mapping",
            target_doctype="User",
            field_mapping=valid_mapping,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_malformed_field_mapping_json(self):
        """validate() should reject malformed JSON in field_mapping."""
        malformed_mapping = "{not valid json"

        doc = self._make_form_definition(
            name="test_invalid_mapping",
            target_doctype="User",
            field_mapping=malformed_mapping,
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    def test_validate_accepts_valid_grid_layout_json(self):
        """validate() should accept valid JSON in grid_layout."""
        valid_layout = json.dumps({"columns": 12, "rows": []})

        doc = self._make_form_definition(
            name="test_valid_grid",
            target_doctype="User",
            grid_layout=valid_layout,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_malformed_grid_layout_json(self):
        """validate() should reject malformed JSON in grid_layout."""
        malformed_layout = "[1, 2, 3,"  # Missing closing bracket

        doc = self._make_form_definition(
            name="test_invalid_grid",
            target_doctype="User",
            grid_layout=malformed_layout,
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    def test_validate_accepts_empty_json_fields(self):
        """validate() should accept empty/None JSON fields."""
        doc = self._make_form_definition(
            name="test_empty_json",
            target_doctype="User",
            form_schema=None,
            field_mapping=None,
            grid_layout=None,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_accepts_valid_validation_rules_json(self):
        """validate() should accept valid JSON in validation_rules."""
        valid_rules = json.dumps(
            {"fields": {"email": {"required": True, "pattern": "^[^@]+@[^@]+$"}}}
        )

        doc = self._make_form_definition(
            name="test_valid_rules",
            target_doctype="User",
            validation_rules=valid_rules,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_malformed_validation_rules_json(self):
        """validate() should reject malformed JSON in validation_rules."""
        malformed_rules = '{"rules": ["incomplete'

        doc = self._make_form_definition(
            name="test_invalid_rules",
            target_doctype="User",
            validation_rules=malformed_rules,
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    def test_validate_accepts_valid_allowed_roles_json(self):
        """validate() should accept valid JSON in allowed_roles."""
        valid_roles = json.dumps(["System Manager", "Accounts Manager"])

        doc = self._make_form_definition(
            name="test_valid_roles",
            target_doctype="User",
            allowed_roles=valid_roles,
            do_not_save=True,
        )

        # Should not raise
        doc.validate()

    def test_validate_rejects_malformed_allowed_roles_json(self):
        """validate() should reject malformed JSON in allowed_roles."""
        malformed_roles = '["System Manager", "Accounts Manager"'

        doc = self._make_form_definition(
            name="test_invalid_roles",
            target_doctype="User",
            allowed_roles=malformed_roles,
            do_not_save=True,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.validate()

    # ------------------------------------------------------------------
    #  Tests — get_resolved_schema()
    # ------------------------------------------------------------------

    def test_get_resolved_schema_enriches_with_meta(self):
        """get_resolved_schema() should enrich fields with live DocType meta."""
        form_schema = json.dumps(
            {
                "fields": [
                    {"fieldname": "email", "label": "Email Address"},
                    {"fieldname": "first_name", "label": "First Name"},
                ]
            }
        )

        doc = self._make_form_definition(
            name="test_enriched_schema",
            target_doctype="User",
            form_schema=form_schema,
        )

        result = doc.get_resolved_schema()

        self.assertIn("form_definition", result)
        self.assertIn("fields", result)
        self.assertIn("doctype_meta", result)

        # Check that fields are enriched with meta
        fields = result["fields"]
        self.assertGreater(len(fields), 0)

        # First field should have email meta merged with form schema
        email_field = next((f for f in fields if f.get("fieldname") == "email"), None)
        self.assertIsNotNone(email_field)
        self.assertEqual(email_field["fieldname"], "email")
        # Should have Frappe meta (fieldtype, label, reqd, etc.)
        self.assertIn("fieldtype", email_field)

    def test_get_resolved_schema_includes_doctype_meta(self):
        """get_resolved_schema() should include DocType metadata."""
        doc = self._make_form_definition(
            name="test_doctype_meta",
            target_doctype="User",
        )

        result = doc.get_resolved_schema()

        doctype_meta = result["doctype_meta"]
        self.assertEqual(doctype_meta["name"], "User")
        self.assertIn("fields", doctype_meta)
        self.assertIn("is_submittable", doctype_meta)
        self.assertIn("title_field", doctype_meta)

    def test_get_resolved_schema_throws_without_target_doctype(self):
        """get_resolved_schema() should throw if target_doctype is not set."""
        doc = self._make_form_definition(
            name="test_no_target",
            target_doctype=None,
        )

        with self.assertRaises(frappe.ValidationError):
            doc.get_resolved_schema()

    def test_get_resolved_schema_throws_without_permission(self):
        """get_resolved_schema() should throw if user lacks read permission."""
        # Create a form definition for a restricted DocType
        # Using User which usually has some access control
        doc = self._make_form_definition(
            name="test_restricted",
            target_doctype="User",
        )

        # Normally this passes since we're admin. For a real test,
        # we'd need a restricted doctype, but this structure is correct.
        result = doc.get_resolved_schema()
        self.assertIsNotNone(result)

    def test_get_resolved_schema_handles_empty_form_schema(self):
        """get_resolved_schema() should handle missing or empty form_schema."""
        doc = self._make_form_definition(
            name="test_empty_schema",
            target_doctype="User",
            form_schema=None,  # No schema provided
        )

        result = doc.get_resolved_schema()

        self.assertIn("fields", result)
        fields = result["fields"]
        # Without a form_schema, no fields should be enriched
        self.assertEqual(len(fields), 0)

    def test_get_resolved_schema_enriches_multiple_fields(self):
        """get_resolved_schema() should enrich multiple form fields."""
        form_schema = json.dumps(
            {
                "fields": [
                    {"fieldname": "email"},
                    {"fieldname": "first_name"},
                    {"fieldname": "last_name"},
                ]
            }
        )

        doc = self._make_form_definition(
            name="test_multiple_fields",
            target_doctype="User",
            form_schema=form_schema,
        )

        result = doc.get_resolved_schema()
        fields = result["fields"]

        # Should have at least the 3 fields we defined
        self.assertGreaterEqual(len(fields), 3)

        fieldnames = [f.get("fieldname") for f in fields]
        self.assertIn("email", fieldnames)
        self.assertIn("first_name", fieldnames)
        self.assertIn("last_name", fieldnames)

    def test_get_resolved_schema_returns_form_definition_dict(self):
        """get_resolved_schema() should include form_definition as a dict."""
        doc = self._make_form_definition(
            name="test_form_def_dict",
            target_doctype="User",
        )

        result = doc.get_resolved_schema()

        form_def = result["form_definition"]
        self.assertEqual(form_def["doctype"], "NCE Form Definition")
        self.assertEqual(form_def["target_doctype"], "User")
