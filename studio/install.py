# -*- coding: utf-8 -*-
"""
studio.install
~~~~~~~~~~~~~~~~~~

Installation and uninstallation hooks for NCE Studio.

These are called by Frappe during app lifecycle events. Register them
in hooks.py:

    after_install  = "studio.install.after_install"
    before_uninstall = "studio.install.before_uninstall"
    after_uninstall  = "studio.install.after_uninstall"

Frappe v15 / v16 compatible.
"""

from __future__ import unicode_literals

import frappe
from frappe import _


def after_install():
    """Called once after the app is installed on a site.

    Use this to:
    - Create default records (settings, roles, etc.)
    - Set up initial configuration
    - Insert seed data

    NOTE: This runs inside a transaction — if it raises, the install is
    rolled back. Do NOT call frappe.db.commit() here; Frappe handles it.
    """
    _create_default_roles()
    _create_default_settings()

    frappe.logger("studio").info("NCE Studio installed successfully.")


def before_uninstall():
    """Called before the app is uninstalled from a site.

    Use this to:
    - Clean up custom records that won't be removed by DocType deletion
    - Warn about data that will be lost
    - Remove scheduled jobs or integrations

    NOTE: DocTypes owned by this app are dropped automatically by Frappe
    during uninstall — you do NOT need to delete them manually here.
    """
    _cleanup_custom_fields()

    frappe.logger("studio").info("NCE Studio pre-uninstall cleanup complete.")


def after_uninstall():
    """Called after the app is fully uninstalled from a site.

    Use this for any final teardown that must happen after all DocTypes
    and modules have been removed.
    """
    frappe.logger("studio").info("NCE Studio uninstalled.")


# ---------------------------------------------------------------------------
#  Private helpers
# ---------------------------------------------------------------------------


def _create_default_roles():
    """Create any custom roles needed by the app.

    Safe to call multiple times — checks for existence first.
    """
    roles = [
        # ("Role Name", "Role description"),
    ]

    for role_name, role_desc in roles:
        if not frappe.db.exists("Role", role_name):
            role = frappe.get_doc(
                {
                    "doctype": "Role",
                    "role_name": role_name,
                    "desk_access": 1,
                    "is_custom": 1,
                }
            )
            role.insert(ignore_permissions=True)
            frappe.logger("studio").info(f"Created role: {role_name}")


def _create_default_settings():
    """Create or update default Single DocType settings for the app.

    Uncomment and adapt when you add a Settings DocType.
    """
    # Example for a Single DocType called "NCE Studio Settings":
    #
    # if frappe.db.exists("DocType", "NCE Studio Settings"):
    #     settings = frappe.get_single("NCE Studio Settings")
    #     if not settings.some_default_field:
    #         settings.some_default_field = "default_value"
    #         settings.save(ignore_permissions=True)
    pass


def _cleanup_custom_fields():
    """Remove Custom Fields that this app may have added to other DocTypes.

    This prevents orphaned fields after uninstall.
    """
    custom_fields = frappe.get_all(
        "Custom Field",
        filters={"fieldname": ("like", "custom_studio_%")},
        pluck="name",
    )

    for cf_name in custom_fields:
        frappe.delete_doc("Custom Field", cf_name, force=True, ignore_permissions=True)

    if custom_fields:
        frappe.logger("studio").info(
            f"Removed {len(custom_fields)} custom field(s) during uninstall."
        )
