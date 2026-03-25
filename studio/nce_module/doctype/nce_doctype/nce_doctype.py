# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe.model.document import Document


class NceDoctype(Document):
    # ------------------------------------------------------------------
    #  Lifecycle hooks — called in this order:
    #
    #  INSERT:  before_insert → validate → before_save → [DB] → after_insert → on_update
    #  UPDATE:  validate → before_save → [DB] → on_update
    #  SUBMIT:  validate → before_save → before_submit → [DB] → on_submit → on_update
    #  CANCEL:  before_cancel → [DB] → on_cancel → on_update
    #  DELETE:  on_trash → [DB] → after_delete
    # ------------------------------------------------------------------

    def before_insert(self):
        """Called before a brand-new document is inserted into the database."""
        pass

    def validate(self):
        """Called before every save (insert *and* update). Put your
        validations and computed-field logic here."""
        self._validate_required_fields()

    def before_save(self):
        """Called after validate, just before the DB write."""
        pass

    def after_insert(self):
        """Called after a new document is inserted."""
        pass

    def on_update(self):
        """Called after every successful save (insert or update)."""
        pass

    def before_submit(self):
        """Called before a submittable document is submitted."""
        pass

    def on_submit(self):
        """Called after the document is submitted."""
        pass

    def before_cancel(self):
        """Called before the document is cancelled."""
        pass

    def on_cancel(self):
        """Called after the document is cancelled."""
        pass

    def on_trash(self):
        """Called before the document is deleted."""
        pass

    def after_delete(self):
        """Called after the document is deleted."""
        pass

    # ------------------------------------------------------------------
    #  Private helpers
    # ------------------------------------------------------------------

    def _validate_required_fields(self):
        """Example validation — replace with your own logic."""
        # if not self.some_field:
        #     frappe.throw(frappe._("Some Field is required."))
        pass

    # ------------------------------------------------------------------
    #  Whitelisted methods (callable from client JS via frappe.call)
    #
    #  NOTE (v15/v16 compat):
    #  - v16 enforces stricter CSRF; always use frappe.call (POST).
    #  - If the method needs guest access, use @frappe.whitelist(allow_guest=True).
    # ------------------------------------------------------------------

    @frappe.whitelist()
    def custom_action(self):
        """Example whitelisted method.

        Call from JS:
            frappe.call({
                method: "custom_action",
                doc: frm.doc,
                callback: function(r) { ... }
            });
        """
        frappe.msgprint(frappe._("Custom action executed for {0}").format(self.name))


# ----------------------------------------------------------------------
#  Standalone whitelisted helpers (not bound to a document instance)
# ----------------------------------------------------------------------


@frappe.whitelist()
def get_summary(docname):
    """Example standalone API endpoint.

    Call from JS:
        frappe.call({
            method: "studio.nce_module.doctype.nce_doctype.nce_doctype.get_summary",
            args: { docname: "DOCTYPE-00001" },
            callback: function(r) { ... }
        });

    v15/v16 note: Always use explicit order_by when querying.
    """
    doc = frappe.get_doc("NCE Doctype", docname)
    doc.check_permission("read")

    return {
        "name": doc.name,
        "owner": doc.owner,
        "creation": doc.creation,
    }
