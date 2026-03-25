# -*- coding: utf-8 -*-
"""
studio.api.nce_api
~~~~~~~~~~~~~~~~~~~~~~~

Sample whitelisted API endpoints for NCE Studio.

Usage from client JS:
    frappe.call({
        method: "studio.api.nce_api.ping",
        callback: (r) => console.log(r.message),
    });

Usage via REST:
    GET  /api/method/studio.api.nce_api.ping
    POST /api/method/studio.api.nce_api.create_record
"""

from __future__ import unicode_literals

import frappe
from frappe import _


@frappe.whitelist()
def ping():
    """Health-check endpoint. Returns app name and version.

    Requires a logged-in user (default whitelist behaviour).
    """
    from studio import __version__

    return {
        "app": "studio",
        "version": __version__,
        "user": frappe.session.user,
    }


@frappe.whitelist(allow_guest=True)
def get_public_info():
    """Example public endpoint — accessible without authentication.

    Use `allow_guest=True` sparingly and only for truly public data.
    """
    return {
        "app": "studio",
        "message": _("Welcome to NCE Studio"),
    }


@frappe.whitelist()
def create_record(title, description=None):
    """Example write endpoint — creates a NCE Doctype record.

    Args:
        title (str): Required. The record title.
        description (str, optional): A longer description.

    Returns:
        dict: The newly created document name and title.

    Note:
        v16 enforces POST for state-changing endpoints via CSRF.
        Always call this via frappe.call() (which uses POST) rather
        than a bare GET request.
    """
    frappe.has_permission("NCE Doctype", "create", throw=True)

    doc = frappe.get_doc(
        {
            "doctype": "NCE Doctype",
            "title": title,
            "description": description,
        }
    )
    doc.insert()

    return {
        "name": doc.name,
        "title": doc.title,
    }


@frappe.whitelist()
def get_records(filters=None, limit_page_length=20, order_by="creation desc"):
    """Example read endpoint with explicit ordering (v15/v16 safe).

    Args:
        filters (dict, optional): Frappe-style filters.
        limit_page_length (int): Page size. Default 20.
        order_by (str): SQL order clause. Default "creation desc".

    Returns:
        list[dict]: List of matching records.
    """
    frappe.has_permission("NCE Doctype", "read", throw=True)

    if isinstance(filters, str):
        import json

        filters = json.loads(filters)

    records = frappe.get_all(
        "NCE Doctype",
        filters=filters,
        fields=["name", "title", "creation", "modified"],
        limit_page_length=int(limit_page_length),
        order_by=order_by,  # Always explicit — v16 changed default sort
    )

    return records
