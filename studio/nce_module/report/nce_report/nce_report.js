// Copyright (c) [YEAR], NCE Studio and contributors
// For license information, please see license.txt

// v15/v16 compatible — v16 wraps Report JS in an IIFE, so top-level
// var/let/const will NOT leak to global scope. Use frappe.provide()
// if you need to expose helpers globally.

frappe.query_reports["NCE Report"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(
				frappe.datetime.get_today(),
				-1,
			),
			reqd: 1,
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: "\nOpen\nIn Progress\nCompleted\nCancelled",
		},
		// {
		// 	fieldname: "my_link_field",
		// 	label: __("My Link Field"),
		// 	fieldtype: "Link",
		// 	options: "NCE Doctype",
		// },
	],

	// Optional: format individual cells
	// formatter: function (value, row, column, data, default_formatter) {
	// 	value = default_formatter(value, row, column, data);
	// 	if (column.fieldname === "status" && data && data.status === "Completed") {
	// 		value = "<span style='color:green'>" + value + "</span>";
	// 	}
	// 	return value;
	// },

	// Optional: triggered after the report data is rendered
	// after_datatable_render: function (datatable_obj) {},

	// Optional: provide a custom message when no data is returned
	// get_datatable_options(options) {
	// 	return Object.assign(options, {
	// 		noDataMessage: __("No records found for the selected filters."),
	// 	});
	// },
};
