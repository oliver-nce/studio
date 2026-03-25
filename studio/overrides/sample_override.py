# -*- coding: utf-8 -*-
"""
studio.overrides.sample_override
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Example: overriding a standard DocType class from Frappe or another app.

To activate, add to hooks.py::

    override_doctype_class = {
        "ToDo": "studio.overrides.sample_override.CustomToDo",
    }
"""

from __future__ import unicode_literals

import frappe
from frappe import _

try:
    from frappe.desk.doctype.todo.todo import ToDo
except ImportError:
    ToDo = None


if ToDo is not None:

    class CustomToDo(ToDo):
        """Custom extension of the core ToDo DocType.

        Override lifecycle methods (validate, on_update, after_insert, etc.)
        here.  Always call super() first so original behaviour is preserved.
        """

        pass
