# -*- coding: utf-8 -*-
"""
Documentation configuration for NCE Studio.

This file is used by `bench build-docs` to generate static documentation
for the app. Adjust the values below to match your app's details.

Usage:
    bench build-docs --app studio
"""


def get_context(context):
    """Called by the documentation generator to populate context variables."""
    context.brand_html = "NCE Studio"
    context.source_link = "https://github.com/nce-studio/studio"
    context.docs_base_url = "https://nce-studio.github.io/studio"
    context.headline = "NCE Studio Documentation"
    context.sub_heading = "Custom Frappe application — v15 / v16 compatible"

    # Top-level documentation navigation
    context.top_bar_items = [
        {"label": "About", "url": context.docs_base_url + "/about"},
    ]

    # Hide the "Improve this page" link if you don't want public edits
    context.hide_page_edit = True
