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
source_link = "https://github.com/oliver-nce/studio"
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
# --------------------------------------------------------------------------
# doc_events = {}

# --------------------------------------------------------------------------
#  Scheduler Events
# --------------------------------------------------------------------------
# scheduler_events = {
#     "all": ["studio.tasks.all"],
#     "daily": ["studio.tasks.daily"],
#     "hourly": ["studio.tasks.hourly"],
#     "weekly": ["studio.tasks.weekly"],
#     "monthly": ["studio.tasks.monthly"],
# }

# --------------------------------------------------------------------------
#  Permissions
# --------------------------------------------------------------------------
# permission_query_conditions = {
#     "Studio Doctype": "studio.permissions.get_conditions",
# }
#
# has_permission = {
#     "Studio Doctype": "studio.permissions.has_permission",
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
#  Fixtures
# --------------------------------------------------------------------------
# fixtures = [
#     "Custom Field",
#     "Property Setter",
# ]

# --------------------------------------------------------------------------
#  Jinja Customization
# --------------------------------------------------------------------------
# jinja = {
#     "methods": ["studio.utils.jinja.studio_method"],
#     "filters": ["studio.utils.jinja.studio_filter"],
# }

# --------------------------------------------------------------------------
#  Boot Session
# --------------------------------------------------------------------------
# boot_session = "studio.startup.boot_session"

# --------------------------------------------------------------------------
#  User Data Protection (GDPR)
# --------------------------------------------------------------------------
# user_data_fields = []

# --------------------------------------------------------------------------
#  Authentication and Authorization
# --------------------------------------------------------------------------
# auth_hooks = [
#     "studio.auth.validate",
# ]
