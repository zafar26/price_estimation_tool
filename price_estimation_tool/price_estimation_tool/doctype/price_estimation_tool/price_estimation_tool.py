# Copyright (c) 2024, Zafar and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc


class PriceEstimationTool(Document):
	pass


@frappe.whitelist()
def mapped_quotation(source_name,  target_doc=None, ignore_permissions=False):
	table_map = {
		"Price Estimation Tool": {
			"doctype": "Quotation", 
		},
		"Price Estimation Tool Item":{
			"doctype":"Quotation Item",
		}
	}
	
	doc = get_mapped_doc(
		"Price Estimation Tool",
		source_name,
		table_map,
		target_doc,
		ignore_permissions=True,
	)
	return doc
