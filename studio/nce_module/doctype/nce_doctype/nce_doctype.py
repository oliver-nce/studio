# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe.model.document import Document


class NceDoctype(Document):
    """Controller for the NCE Doctype scaffold.

    Add lifecycle hooks (validate, before_save, on_update, etc.) and
    whitelisted methods here as needed.  See the Frappe documentation
    for the full list of available hooks:
    https://frappeframework.com/docs/user/en/basics/doctypes/controllers
    """

    pass


@frappe.whitelist()
def get_summary(docname):
    """Return basic metadata for an NCE Doctype record.

    Call from JS::

        frappe.call({
            method: "studio.nce_module.doctype.nce_doctype.nce_doctype.get_summary",
            args: { docname: "DOCTYPE-00001" },
            callback: function(r) { ... }
        });
    """
    doc = frappe.get_doc("NCE Doctype", docname)
    doc.check_permission("read")

    return {
        "name": doc.name,
        "owner": doc.owner,
        "creation": doc.creation,
    }
