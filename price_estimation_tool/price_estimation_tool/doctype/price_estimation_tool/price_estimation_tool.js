// Copyright (c) 2024, Zafar and contributors
// For license information, please see license.txt

frappe.ui.form.on("Price Estimation Tool", {
	refresh(frm) {
        frm.clear_custom_buttons();
        frm.page.set_primary_action(__("Make Quotation"), () => {
            frm.trigger("make_quotation");
        });
	},
     // Mapped A Document 
     make_quotation(frm) {
		frappe.model.open_mapped_doc({
			method: "price_estimation_tool.price_estimation_tool.doctype.price_estimation_tool.price_estimation_tool.mapped_quotation",
			frm,
		});
	}

});


frappe.ui.form.on("Price Estimation Tool Item", {
    // Calculate Vendor Total Price
    qty(frm, cdt, cdn){ calculate_vendor_total_price(frm,cdt, cdn)},
    vendor_list_price(frm, cdt, cdn){ calculate_vendor_total_price(frm,cdt, cdn) },
    
    // Calculate Vendor Net After exchange Price
    vendor_total_price(frm, cdt, cdn){ calculate_vendor_net_price(frm, cdt, cdn) },
    discount(frm, cdt, cdn){ calculate_vendor_net_price(frm, cdt, cdn) },
    
    // Calculate Sub Total
    exchange_rate(frm, cdt, cdn){ calculate_sub_total(frm, cdt, cdn)},
    vendor_net_price(frm, cdt, cdn){ calculate_sub_total(frm, cdt, cdn)},

    // Calculate Additional Cost
    frieght(frm, cdt, cdn){ calculate_additional_cost(frm, cdt, cdn) },
    custom_duty(frm, cdt, cdn){ calculate_additional_cost(frm, cdt, cdn) },
    miscellaneous(frm, cdt, cdn){ calculate_additional_cost(frm, cdt, cdn) },
   
    // Calculate Overall Cost
    vendor_net_price(frm, cdt, cdn){ calculate_overall_cost(frm, cdt, cdn) },
    sub_total(frm, cdt, cdn){ calculate_overall_cost(frm, cdt, cdn) },
    total_extra_cost(frm, cdt, cdn){ calculate_overall_cost(frm, cdt, cdn) },
    markup(frm, cdt, cdn){ calculate_overall_cost(frm, cdt, cdn) },

    item_code : async (frm, cdt,cdn)=>{
        let row = frappe.get_doc(cdt, cdn);
        let data_new = await frappe.db.get_list('Item Price',{ filters:{"item_code": row.item_code, "buying": 1 }, fields:["currency", "price_list_rate"]})
        frappe.model.set_value(cdt,cdn,"vendor_list_price", data_new[0].price_list_rate)

    
        // get company default currency
	    let base_currency = frappe.defaults.get_global_default("currency")
        let cur_exchange=''
        if (data_new[0] && data_new[0].currency != base_currency){
            cur_exchange = await frappe.db.get_value("Currency Exchange", {"from_currency": data_new[0].currency, "to_currency": base_currency },["exchange_rate"])
        }
        if (cur_exchange.message.exchange_rate){
        frappe.model.set_value(cdt,cdn,"exchange_rate", cur_exchange.message.exchange_rate)

        }
    }
});

// Calculations
function calculate_vendor_total_price(frm, cdt, cdn){
    let row = frappe.get_doc(cdt, cdn);
    let qty = row.qty
    let vendor_price = row.vendor_list_price
    if (qty && vendor_price){
        frappe.model.set_value(cdt,cdn,"vendor_total_price", qty * vendor_price)
    } 
}

function calculate_vendor_net_price(frm, cdt, cdn){
    let row = frappe.get_doc(cdt, cdn);
    let vendor_total_price = row.vendor_total_price
    let discount = row.discount
    if (vendor_total_price && discount){
        frappe.model.set_value(cdt,cdn,"vendor_net_price", vendor_total_price * (1- (discount/100)))
    }else if (vendor_total_price){
        frappe.model.set_value(cdt,cdn,"vendor_net_price", vendor_total_price * (1- (0/100)))

    }calculate_sub_total(frm,cdt, cdn)
}

function  calculate_sub_total(frm, cdt, cdn){
    let row = frappe.get_doc(cdt, cdn);
    let vendor_net_price = row.vendor_net_price
    let exchange_rate = row.exchange_rate
    if (vendor_net_price && exchange_rate){
        frappe.model.set_value(cdt,cdn,"sub_total", vendor_net_price * exchange_rate )
    }else if(vendor_net_price){
        frappe.model.set_value(cdt,cdn,"sub_total", vendor_net_price )
    }else if(exchange_rate){
        frappe.model.set_value(cdt,cdn,"sub_total",  exchange_rate )
    }
}


function  calculate_additional_cost(frm, cdt, cdn){
    let row = frappe.get_doc(cdt, cdn);
    let frieght = row.frieght
    let custom_duty = row.custom_duty
    let miscellaneous = row.miscellaneous
    let aditional_amount = 0
    if (frieght){
        aditional_amount += Number(frieght)
    }
    if (custom_duty){
        aditional_amount += Number(custom_duty)
    }
    if (miscellaneous){
        aditional_amount += Number(miscellaneous)
    }
    frappe.model.set_value(cdt,cdn,"total_extra_cost", aditional_amount )
}

function calculate_overall_cost(frm, cdt, cdn){
    let row = frappe.get_doc(cdt, cdn);
    let vendor_net_price = row.vendor_net_price
    let sub_total = row.sub_total
    let total_extra_cost = row.total_extra_cost || 0
    let markup = row.markup
    if (vendor_net_price && sub_total && markup){
        let qty = row.qty
        let selling_price = Math.ceil((sub_total / (1 - (markup/100) )+ total_extra_cost) / qty) 
        frappe.model.set_value(cdt,cdn, "rate", selling_price )
        frappe.model.set_value(cdt,cdn, "total_selling_price", Math.ceil(selling_price * qty ))
        frappe.model.set_value(cdt,cdn, "profit", ( Math.ceil(selling_price * qty) - ( sub_total + total_extra_cost)) )
    }
}