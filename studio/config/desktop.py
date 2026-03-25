# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from frappe import _


def get_data():
    """Return desktop icons for this app.

    Used by Frappe v15 to populate the module page / desktop shortcuts.
    v16 uses Workspace JSON instead, but this is still read as a fallback.

    Returns:
        list[dict]: Each dict defines one desktop icon/card.
    """
    return [
        {
            "module_name": "NCE Module",
            "label": _("NCE Module"),
            "color": "#4F46E5",
            "icon": "octicon octicon-database",
            "type": "module",
            "description": _("NCE Module description."),
        },
        # Add more modules / shortcuts here:
        # {
        #     "module_name": "Another Module",
        #     "label": _("Another Module"),
        #     "color": "#10B981",
        #     "icon": "octicon octicon-tools",
        #     "type": "module",
        #     "description": _("Another Module description."),
        # },
    ]
