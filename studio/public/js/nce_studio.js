/**
 * studio.js — Global Desk JavaScript for NCE Studio
 *
 * Loaded on every Desk page when uncommented in hooks.py:
 *   app_include_js = "/assets/studio/js/studio.js"
 *
 * v15/v16 Compatibility Notes:
 *   - v16 wraps Report/Page/Chart JS in IIFEs — top-level var/let/const
 *     will NOT leak to global scope.
 *   - Use frappe.provide() to safely create namespaces.
 *   - Use frappe.call / frappe.xcall for server communication.
 *   - Do NOT hardcode /app or /desk routes — use frappe.set_route().
 */

// ---------------------------------------------------------------------------
//  Namespace — safe in both v15 (global scope) and v16 (IIFE scope)
// ---------------------------------------------------------------------------
frappe.provide("studio");
frappe.provide("studio.utils");

// ---------------------------------------------------------------------------
//  App Initialization
// ---------------------------------------------------------------------------
$(document).ready(function () {
	// Called once when the Desk finishes loading.
	// Good place for one-time setup, event listeners, etc.
	// console.log("NCE Studio loaded");
});

// ---------------------------------------------------------------------------
//  Utility Helpers
//  Access from anywhere: studio.utils.show_alert("Hello!")
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper around frappe.show_alert.
 * @param {string} message - Alert message text
 * @param {string} [indicator="green"] - Color indicator (green|blue|orange|red)
 * @param {number} [seconds=5] - How long to show the alert
 */
studio.utils.show_alert = function (message, indicator, seconds) {
	frappe.show_alert(
		{
			message: message,
			indicator: indicator || "green",
		},
		seconds || 5,
	);
};

/**
 * Call a whitelisted Python method and return a Promise.
 * Uses frappe.xcall (Promise-based, cleaner than frappe.call).
 *
 * @param {string} method - Dotted path, e.g. "studio.api.nce_api.ping"
 * @param {Object} [args={}] - Keyword arguments passed to the server method
 * @returns {Promise} Resolves with the method's return value
 *
 * Usage:
 *   const result = await studio.utils.call("studio.api.nce_api.ping", { name: "World" });
 */
studio.utils.call = function (method, args) {
	return frappe.xcall(method, args || {});
};

/**
 * Navigate to a route without hardcoding /app or /desk.
 * Works identically in v15 and v16.
 *
 * @param  {...string} route_parts - Route segments, e.g. ("Form", "NCE Doctype", "DOC-001")
 */
studio.utils.go_to = function () {
	frappe.set_route.apply(null, arguments);
};

// ---------------------------------------------------------------------------
//  Listview Settings (example — uncomment and rename as needed)
// ---------------------------------------------------------------------------
// frappe.listview_settings["NCE Doctype"] = {
// 	add_fields: ["status"],
// 	get_indicator: function (doc) {
// 		if (doc.status === "Active") {
// 			return [__("Active"), "green", "status,=,Active"];
// 		}
// 		return [__("Inactive"), "grey", "status,=,Inactive"];
// 	},
// };
