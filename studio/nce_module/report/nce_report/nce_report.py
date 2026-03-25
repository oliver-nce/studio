# -*- coding: utf-8 -*-
# Copyright (c) [YEAR], NCE Studio and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe import _


def execute(filters=None):
    """Entry point called by the Frappe report engine.

    Args:
            filters (dict, optional): User-selected filters from the report UI.

    Returns:
            tuple: (columns, data) — or (columns, data, message, chart, report_summary)
    """
    filters = frappe._dict(filters or {})
    columns = get_columns(filters)
    data = get_data(filters)
    chart = get_chart(data)
    report_summary = get_report_summary(data)

    return columns, data, None, chart, report_summary


def get_columns(filters):
    """Define report columns.

    Returns:
            list[dict]: Each dict defines one column in the report grid.
    """
    return [
        {
            "label": _("ID"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "NCE Doctype",
            "width": 180,
        },
        {
            "label": _("Title"),
            "fieldname": "title",
            "fieldtype": "Data",
            "width": 240,
        },
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 120,
        },
        {
            "label": _("Created On"),
            "fieldname": "creation",
            "fieldtype": "Datetime",
            "width": 180,
        },
        {
            "label": _("Modified On"),
            "fieldname": "modified",
            "fieldtype": "Datetime",
            "width": 180,
        },
    ]


def get_data(filters):
    """Fetch report data from the database.

    NOTE (v15/v16 compat): Always use explicit `order_by`.
    v16 changed the default sort from `modified desc` to `creation desc`.

    Args:
            filters (frappe._dict): Report filters.

    Returns:
            list[dict]: Row data for the report grid.
    """
    query_filters = {}

    if filters.get("status"):
        query_filters["status"] = filters.status

    if filters.get("from_date"):
        query_filters["creation"] = (">=", filters.from_date)

    if filters.get("to_date"):
        query_filters["creation"] = ("<=", filters.to_date)

    # Handle combined date range
    if filters.get("from_date") and filters.get("to_date"):
        query_filters["creation"] = (
            "between",
            [filters.from_date, filters.to_date],
        )

    data = frappe.get_all(
        "NCE Doctype",
        filters=query_filters,
        fields=["name", "title", "status", "creation", "modified"],
        order_by="creation desc",  # Always explicit — v15/v16 safe
        limit_page_length=0,
    )

    return data


def get_chart(data):
    """Build an optional chart object for the report.

    Args:
            data (list[dict]): The report row data.

    Returns:
            dict | None: Frappe chart configuration, or None to skip.
    """
    if not data:
        return None

    # Count records per status
    status_counts = {}
    for row in data:
        status = row.get("status") or _("Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    labels = list(status_counts.keys())
    values = list(status_counts.values())

    return {
        "data": {
            "labels": labels,
            "datasets": [{"name": _("Count"), "values": values}],
        },
        "type": "bar",
        "colors": ["#4F46E5"],
    }


def get_report_summary(data):
    """Build an optional summary strip shown above the report grid.

    Args:
            data (list[dict]): The report row data.

    Returns:
            list[dict] | None: Summary indicator cards, or None to skip.
    """
    if not data:
        return None

    total = len(data)
    open_count = sum(1 for d in data if d.get("status") == "Open")
    completed = sum(1 for d in data if d.get("status") == "Completed")

    return [
        {
            "value": total,
            "label": _("Total Records"),
            "datatype": "Int",
            "indicator": "blue",
        },
        {
            "value": open_count,
            "label": _("Open"),
            "datatype": "Int",
            "indicator": "orange",
        },
        {
            "value": completed,
            "label": _("Completed"),
            "datatype": "Int",
            "indicator": "green",
        },
    ]
