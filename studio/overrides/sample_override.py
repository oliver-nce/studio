NCE Studio/studio/studio/overrides/sample_override.py
```
# -*- coding: utf-8 -*-
"""
studio.overrides.sample_override
~~~~~~~~~~ ~~~~~~~~~~~~~~~~~~~~~

Example: overriding a standard DocType class from Frappe or another app.

To activate, uncomment the corresponding entry in hooks.py:

    override_doctype_class = {
        "ToDo": "studio.overrides.sample_override.CustomToDo",
    }

v15/v16 Compatibility Notes:
    - Always call super() in overridden lifecycle methods.
    - has_permission must return True or False explicitly (v16 strict).
    - Do NOT rely on implicit globals in JS counterparts (v16 IIFE scope).
"""

from __future__ import unicode_literals

import frappe
from frappe import _

# ---------------------------------------------------------------------------
#  Import the original class you want to extend.
#
#  TIP: Use a try/except if the base DocType may not exist (e.g. ERPNext
#       DocTypes when ERPNext is not installed).
# ---------------------------------------------------------------------------

try:
    from frappe.desk.doctype.todo.todo import ToDo
except ImportError:
    ToDo = None


if ToDo is not None:

    class CustomToDo(ToDo):
        """Custom extension of the core ToDo DocType.

        This class inherits everything from the original ToDo and lets you
        add, modify, or wrap any lifecycle method.
        """

        def validate(self):
            """Called before every save (insert + update)."""
            # Always call the parent first so original validations run.
            super().validate()

            # ── Add your custom validation logic below ──────────────
            # Example: enforce a maximum description length
            # if self.description and len(self.description) > 5000:
            #     frappe.throw(
            #         _("Description must be 5 000 characters or fewer."),
            #         title=_("Validation Error"),
            #     )

        def on_update(self):
            """Called after every successful save."""
            super().on_update()

            # ── Post-save side-effects ──────────────────────────────
            # Example: log a message when a high-priority ToDo is saved
            # if self.priority == "High":
            #     frappe.logger("studio").info(
            #         f"High-priority ToDo updated: {self.name}"
            #     )

        def after_insert(self):
            """Called once, immediately after a new document is inserted."""
            super().after_insert()

            # ── React to new records ────────────────────────────────
            # Example: send a notification
            # frappe.publish_realtime(
            #     "studio:todo_created",
            #     {"name": self.name, "description": self.description},
            #     user=self.allocated_to,
            # )


# ---------------------------------------------------------------------------
#  Standalone override example — overriding a whitelisted method.
#
#  To activate, uncomment in hooks.py:
#
#      override_whitelisted_methods = {
#          "frappe.client.get_count": "studio.overrides.sample_override.custom_get_count",
#      }
# ---------------------------------------------------------------------------


@frappe.whitelist()
def custom_get_count(doctype, filters=None, debug=False, cache=False):
    """Drop-in replacement for frappe.client.get_count with extra logging.

    v15/v16 note: Whitelisted overrides must have the same (or compatible)
    signature as the original. v16 enforces stricter CSRF — always use
    frappe.call() (POST) from the client side.
    """
    # Call the original implementation
    from frappe.client import get_count

    count = get_count(doctype, filters=filters, debug=debug, cache=cache)

    # Add your custom behaviour
    # frappe.logger("studio").debug(
    #     f"get_count called for {doctype} with filters={filters} → {count}"
    # )

    return count
