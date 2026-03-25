// Copyright (c) [YEAR], NCE Studio and contributors
// For license information, please see license.txt

// v15/v16 compatible — use frappe.provide() for namespace safety.
// v16 loads Report/Page/Chart JS as IIFEs; top-level var/let/const
// will NOT leak to global scope. Always attach shared helpers to
// a namespace via frappe.provide().

frappe.ui.form.on("NCE Doctype", {
	// ─── Form Setup (runs once when form is first loaded) ───
	setup(frm) {
		// Set query filters for Link fields
		// frm.set_query("linked_field", function () {
		// 	return {
		// 		filters: { enabled: 1 },
		// 	};
		// });
	},

	// ─── Form Refresh (runs on every load / reload) ───
	refresh(frm) {
		// Add custom buttons for saved documents
		// NOTE: Uncomment and update the method path when a real endpoint exists.
		// if (!frm.is_new()) {
		// 	frm.add_custom_button(__("Do Something"), function () {
		// 		frappe.call({
		// 			method: "studio.api.nce_api.your_method_here",
		// 			args: {
		// 				name: frm.doc.name,
		// 			},
		// 			callback(r) {
		// 				if (r.message) {
		// 					frappe.msgprint(r.message);
		// 					frm.reload_doc();
		// 				}
		// 			},
		// 		});
		// 	});
		// }
	},

	// ─── Validate (runs before save, client-side) ───
	validate(frm) {
		// Example client-side validation
		// if (!frm.doc.some_required_field) {
		// 	frappe.msgprint(__("Some Required Field is mandatory."));
		// 	frappe.validated = false;
		// }
	},

	// ─── Field Change Handlers ───
	// my_field_name(frm) {
	// 	// Triggered when "my_field_name" changes
	// 	if (frm.doc.my_field_name) {
	// 		frm.set_value("another_field", frm.doc.my_field_name.toUpperCase());
	// 	}
	// },
});

// ─── Child Table Events ───
// frappe.ui.form.on("NCE Doctype Item", {
// 	// Triggered when a row field changes
// 	qty(frm, cdt, cdn) {
// 		let row = locals[cdt][cdn];
// 		frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
// 		_recalculate_totals(frm);
// 	},
//
// 	rate(frm, cdt, cdn) {
// 		let row = locals[cdt][cdn];
// 		frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
// 		_recalculate_totals(frm);
// 	},
//
// 	items_remove(frm) {
// 		_recalculate_totals(frm);
// 	},
// });

// ─── Private Helpers (module-scoped, safe in v16 IIFE) ───
// function _recalculate_totals(frm) {
// 	let total = 0;
// 	(frm.doc.items || []).forEach(function (row) {
// 		total += row.amount || 0;
// 	});
// 	frm.set_value("total_amount", total);
// }
