import { createListResource } from "frappe-ui"

const studioForms = createListResource({
	method: "GET",
	doctype: "NCE Form Definition",
	fields: [
		"name",
		"form_title",
		"target_doctype",
		"studio_page",
		"creation",
		"modified",
	],
	auto: true,
	cache: "nce-forms",
	orderBy: "modified desc",
	pageLength: 50,
})

export { studioForms }
