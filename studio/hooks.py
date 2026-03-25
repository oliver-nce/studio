NCE Studio/studio/studio/hooks.py
</path>
```
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

# ===========================================================================
#  NCE Studio — hooks.py
#  The central configuration file for this Frappe application.
#
#  Frappe v15 / v16 compatible.
#  Docs: https://frappeframework.com/docs/user/en/basics/hooks
# ===========================================================================

app_name = "studio"
app_title = "NCE Studio"
app_publisher = "NCE Studio"
app_description = "NCE Studio"
app_email = "developer@example.com"
app_license = "MIT"
source_link = "https://github.com/oliver-nce/nce-studio"
app_icon = "octicon octicon-database"
app_color = "#4F46E5"

# App version — keep in sync with __init__.py and pyproject.toml
app_version = "0.0.1"

# --------------------------------------------------------------------------
#  App Logo (v16 app landing page)
#  v16 shows an Android-style app drawer that needs a logo image.
#  This key is safely ignored by v15.
# --------------------------------------------------------------------------
app_logo_url = "/assets/studio/images/logo.png"

# --------------------------------------------------------------------------
#  Includes — CSS / JS injected into every Desk page
# --------------------------------------------------------------------------
# app_include_css = "/assets/studio/css/studio.css"
# app_include_js = "/assets/studio/js/studio.js"

# Web includes (portal / website pages)
# web_include_css = "/assets/studio/css/studio_web.css"
# web_include_js = "/assets/studio/js/studio_web.js"

# --------------------------------------------------------------------------
#  Website / Portal
# --------------------------------------------------------------------------
# website_route_rules = [
#     {"from_route": "/my-page/<path:app_path>", "to_route": "my_page"},
# ]

# Home page (for portal users)
# home_page = "login"

# --------------------------------------------------------------------------
#  Installation / Uninstall
# --------------------------------------------------------------------------
# after_install = "studio.install.after_install"
# before_uninstall = "studio.install.before_uninstall"
# after_uninstall = "studio.install.after_uninstall"

# --------------------------------------------------------------------------
#  Migration
# --------------------------------------------------------------------------
# after_migrate = "studio.migrate.after_migrate"

# --------------------------------------------------------------------------
#  Document Events
#  Hook into lifecycle events for any DocType (even from other apps).
#
#  Format:
#    doc_events = {
#        "DocType Name": {
#            "event_name": "dotted.path.to.handler",
#        },
#        "*": {  # all DocTypes
#            "on_update": "studio.events.all_on_update",
#        },
#    }
# --------------------------------------------------------------------------
# doc_events = {}

# --------------------------------------------------------------------------
#  Scheduler Events
# --------------------------------------------------------------------------
# scheduler_events = {
#     "all": [
#         "studio.tasks.all",
#     ],
#     "daily": [
#         "studio.tasks.daily",
#     ],
#     "hourly": [
#         "studio.tasks.hourly",
#     ],
#     "weekly": [
#         "studio.tasks.weekly",
#     ],
#     "monthly": [
#         "studio.tasks.monthly",
#     ],
#     "cron": {
#         "0 9 * * 1": [  # Every Monday at 09:00
#             "studio.tasks.monday_morning",
#         ],
#     },
# }

# --------------------------------------------------------------------------
#  Permissions
# --------------------------------------------------------------------------
# permission_query_conditions = {
#     "NCE Doctype": "studio.permissions.get_nce_doctype_conditions",
# }
#
# has_permission = {
#     "NCE Doctype": "studio.permissions.has_nce_doctype_permission",
# }

# --------------------------------------------------------------------------
#  DocType Class Overrides
# --------------------------------------------------------------------------
# override_doctype_class = {
#     "ToDo": "studio.overrides.CustomToDo",
# }

# --------------------------------------------------------------------------
#  Override Whitelisted Methods
# --------------------------------------------------------------------------
# override_whitelisted_methods = {
#     "frappe.desk.doctype.event.event.get_events": "studio.overrides.get_events",
# }

# --------------------------------------------------------------------------
#  Override Standard DocType Dashboard Data
# --------------------------------------------------------------------------
# override_doctype_dashboards = {
#     "Task": "studio.overrides.get_dashboard_data",
# }

# --------------------------------------------------------------------------
#  Fixtures — auto-export / import via bench
#  Run: bench export-fixtures --app studio
# --------------------------------------------------------------------------
# fixtures = [
#     "Custom Field",
#     "Property Setter",
#     {
#         "doctype": "Role",
#         "filters": [["name", "in", ["My Custom Role"]]],
#     },
# ]

# --------------------------------------------------------------------------
#  Jinja Customization
# --------------------------------------------------------------------------
# jinja = {
#     "methods": [
#         "studio.utils.jinja.nce_method",
#     ],
#     "filters": [
#         "studio.utils.jinja.nce_filter",
#     ],
# }

# --------------------------------------------------------------------------
#  Boot Session — add data to the initial page load
# --------------------------------------------------------------------------
# boot_session = "studio.startup.boot_session"

# --------------------------------------------------------------------------
#  Notification / Email
# --------------------------------------------------------------------------
# notification_config = "studio.notifications.get_notification_config"

# --------------------------------------------------------------------------
#  User Data Protection (GDPR)
# --------------------------------------------------------------------------
# user_data_fields = [
#     {
#         "doctype": "NCE Doctype",
#         "filter_by": "owner",
#         "redact_fields": ["email_address", "phone"],
#         "partial": True,
#     },
# ]

# --------------------------------------------------------------------------
#  Authentication and Authorization
# --------------------------------------------------------------------------
# auth_hooks = [
#     "studio.auth.validate",
# ]

# --------------------------------------------------------------------------
#  PDF / Print
#  v16 uses wkhtmltopdf with stricter settings — avoid external resources.
# --------------------------------------------------------------------------
# pdf_header_html = "studio.utils.pdf.get_header_html"
# pdf_body_html = "studio.utils.pdf.get_body_html"
# pdf_footer_html = "studio.utils.pdf.get_footer_html"
