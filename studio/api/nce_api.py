# -*- coding: utf-8 -*-
"""
studio.api.nce_api
~~~~~~~~~~~~~~~~~~

Backward-compatible re-export hub.

All endpoints have been moved to focused modules:

- ``studio.api.lock_api``  — edit-lock endpoints
- ``studio.api.field_api`` — field resolution & document utilities
- ``studio.api.theme_api`` — theme settings & CSS regeneration

This file re-exports every public function so that existing Frappe
whitelisted API paths (``studio.api.nce_api.<func>``) and Python
imports continue to work without changes.
"""

from studio.api.lock_api import (  # noqa: F401
    acquire_edit_lock,
    check_edit_lock,
    refresh_edit_lock,
    release_edit_lock,
)
from studio.api.field_api import (  # noqa: F401
    get_random_doc_name,
    resolve_fields,
    save_resolved_fields,
)
from studio.api.theme_api import (  # noqa: F401
    get_theme_settings,
    regenerate_theme_css,
)
