# -*- coding: utf-8 -*-
"""
NCE Form Definition — Frappe Document Controller

Manages form schema definitions for NCE Studio form pages.
Each record defines the layout, field mapping, and behaviour of a
Studio-rendered form bound to a specific Frappe DocType.
"""

from __future__ import unicode_literals

import json

import frappe
from frappe import _
from frappe.model.document import Document


class NCEFormDefinition(Document):
    # ------------------------------------------------------------------
    # Lifecycle hooks
    # ------------------------------------------------------------------

    def validate(self):
        """Validate the form definition before saving."""
        self._validate_target_doctype()
        self._validate_json_fields()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _validate_target_doctype(self):
        """Ensure the linked DocType actually exists."""
        if not self.target_doctype:
            return
        if not frappe.db.exists("DocType", self.target_doctype):
            frappe.throw(
                _("Target DocType '{0}' does not exist.").format(self.target_doctype),
                title=_("Invalid DocType"),
            )

    def _validate_json_fields(self):
        """Parse and re-serialise all JSON fields to catch malformed input."""
        json_fields = [
            "form_schema",
            "field_mapping",
            "grid_layout",
            "grid_config",
            "tab_layout",
            "validation_rules",
            "allowed_roles",
        ]
        for fieldname in json_fields:
            value = self.get(fieldname)
            if not value:
                continue
            if isinstance(value, str):
                try:
                    json.loads(value)
                except json.JSONDecodeError as exc:
                    frappe.throw(
                        _("Field '{0}' contains invalid JSON: {1}").format(
                            fieldname, str(exc)
                        ),
                        title=_("Invalid JSON"),
                    )

    # ------------------------------------------------------------------
    # Public / whitelisted methods
    # ------------------------------------------------------------------

    @frappe.whitelist()
    def get_resolved_schema(self):
        """Return the form schema merged with live DocType field metadata.

        Fetches ``frappe.get_meta(self.target_doctype)`` and enriches each
        field entry in ``form_schema`` with its Frappe meta (fieldtype,
        options, label, reqd, etc.).  Useful for the form runtime so it
        does not need a separate meta call.

        Returns:
            dict: {
                "form_definition": <this doc as dict>,
                "fields": [<enriched field meta>, ...],
                "doctype_meta": <serialisable subset of DocType meta>
            }
        """
        if not self.target_doctype:
            frappe.throw(_("Target DocType is not set."))

        frappe.has_permission(self.target_doctype, "read", throw=True)

        meta = frappe.get_meta(self.target_doctype)

        # Build a lookup of fieldname → meta field
        meta_fields = {f.fieldname: f.as_dict() for f in meta.fields}

        # Parse form_schema
        schema = {}
        if self.form_schema:
            try:
                schema = (
                    json.loads(self.form_schema)
                    if isinstance(self.form_schema, str)
                    else self.form_schema
                )
            except (json.JSONDecodeError, TypeError):
                schema = {}

        # Enrich schema fields with live meta
        enriched_fields = []
        for field_entry in schema.get("fields", []):
            fieldname = (
                field_entry.get("fieldname")
                or field_entry.get("field_path", "").split(".")[-1]
            )
            meta_field = meta_fields.get(fieldname, {})
            enriched = {**meta_field, **field_entry}
            enriched_fields.append(enriched)

        return {
            "form_definition": self.as_dict(),
            "fields": enriched_fields,
            "doctype_meta": {
                "name": meta.name,
                "module": meta.module,
                "is_submittable": meta.is_submittable,
                "title_field": meta.title_field,
                "fields": [f.as_dict() for f in meta.fields],
            },
        }
