# -*- coding: utf-8 -*-
"""
studio.www.studio
~~~~~~~~~~~~~~~~~

Serves the NCE Studio single-page application.

The ``get_context`` function is called by Frappe when rendering
``/studio`` from the web server. It injects the session context
(user, permissions, site URL) that the Vue app needs to bootstrap.

``get_context_for_dev`` is the variant called by the Vite dev server
proxy during local development (``yarn dev``).
"""

from __future__ import unicode_literals

import frappe
from frappe import _


def get_context(context):
    """Render context for /studio page.

    Sets no_cache so Frappe never serves a stale HTML shell.
    The Vue app handles its own caching via the Vite build manifest.
    """
    context.no_cache = 1


@frappe.whitelist()
def get_context_for_dev():
    """Return session context for the Vite dev server.

    Called by main.ts during local development:
        await frappeRequest({ url: "/api/method/studio.www.studio.get_context_for_dev" })

    Returns:
        dict: Keys injected into ``window`` by main.ts.
    """
    if not frappe.conf.developer_mode:
        frappe.throw(_("This endpoint is only available in developer mode."))

    return {
        "site_url": frappe.utils.get_url(),
        "csrf_token": frappe.sessions.get_csrf_token(),
        "user": frappe.session.user,
        "user_image": frappe.db.get_value("User", frappe.session.user, "user_image"),
        "lang": frappe.local.lang,
    }
