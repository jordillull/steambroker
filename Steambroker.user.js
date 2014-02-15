// ==UserScript==
// @name        Steambroker
// @namespace   http://jordillull.com/steambroker
// @include     http://steamcommunity.com/market/
// @version     1
// @grant       none
// ==/UserScript==

/* Settings */

var highlight_css = "background-color: #1DA300; color: #0B0B0B;";
var lowlight_css = "background-color: #7A2D2D; color: black;";

var autoreload = true;          // Autoreloads if nothing interesting was found.
var reloadonpurchase = true;    // Autoreloads after a purchase
var autopurchase = true;        // Automatically purchases items on your target_items list
var time_between_reloads = 0.9; // Not really a linear time

var target_items = [
    // Usage:
    //   {name: your_item_name, game_name: your_game_name, price: your_max_price}
    //
	// At least one name must be provided, regular expressions can be used for names.
    //
    // Example:
	// {name: /^Snow Globe #1$/, price: 0.10},
	// {name: 'Trading Card', game_name: 'Battle Toads' price: 0.42},
];

/* End settings */

var found_something = false;

// http://clifgriffin.com/using-javascript-to-scroll-to-a-specific-elementobject/
function findPos(obj, offset) {
	var curtop = 0;
	if (obj.offsetParent) {
		do {
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	return [curtop + offset];
	}
}

function init_window() {
	var sells_block    = document.getElementById('sellListings');
	var listings_block = document.getElementById('myListings');
	var tab_popular    = document.getElementById('popularItemsTable');
	var tab_recent     = document.getElementById('sellListingsTable');
	var tab_sold       = document.getElementById('soldListingTable');

	//document.getElementById('tabRecentSellListings').click()
	window.scroll(0, findPos(sells_block, 110));
	tab_popular.hide();
	tab_recent.show();
}

function parse_item_row(row) {
	var parsed_row = {}
	parsed_row.name      = row.getElementsByClassName('market_listing_item_name_link')[0].innerHTML;
	parsed_row.game_name = row.getElementsByClassName('market_listing_game_name')[0].innerHTML;
	parsed_row.price     = parseFloat(row.getElementsByClassName('market_listing_price_with_fee')[0].innerHTML.replace('.','').replace(',','.'));
	parsed_row.html      = row;
	parsed_row.html_id   = row.id;
	parsed_row.buy_now_button = row.getElementsByClassName('item_market_action_button')[0];

	return parsed_row;
}


function get_items(node) {
	var result_items = [];
	var i = 0;
	var market_rows = node.getElementsByClassName('market_listing_row');
	while (child = market_rows[i++]) {
		result_items.push(parse_item_row(child));
	}
	return result_items;
}

function purchase() {
    if (! document.getElementById('market_buynow_dialog_accept_ssa').checked) {
        document.getElementById('market_buynow_dialog_accept_ssa').checked = true;
    }
	document.getElementById('market_buynow_dialog_purchase').click();
}

function wait_for_purchase() {
    if (document.getElementById('market_buynow_dialog_error_text').innerHTML) {
        console.log('Purchase error :(');

        if (autoreload) {
            reload();
        }
    } else if (document.getElementById('market_buynow_dialog_purchasecomplete_message').visible()) {
        console.log(document.getElementById('market_buynow_dialog_purchasecomplete_message'));
        console.log('Purchase completed! :D');

        if (autoreload && reloadonpurchase) {
            reload();
        }

    } else {
		setTimeout(wait_for_purchase, 1000);
    }
}

function hunt_item(item) {
	for (var i in target_items) {
		if (	(! target_items[i].name || item.name.match(target_items[i].name) )
			&&  (! target_items[i].game_name || item.game_name.match(target_items[i].game_name))
		    ) {
			if (item.price <= target_items[i].price) {
				highlight(item);
                if ( autopurchase && ! found_something) {
                    item.buy_now_button.click();
                    setTimeout(purchase, 150 + (Math.random()*150)); // Fair (gosu) reaction time
                }
				return true;
			} else {
				lowlight(item);
			}
		}
	}
	return false;
}

function highlight(item) {
	item.html.setStyle(highlight_css);
}

function lowlight(item) {
	item.html.setStyle(lowlight_css);
}


function parse_recent_sales() {
	var recent_items = get_items(document.getElementById('sellListingRows'));

	found_something = false;
	for (var i in recent_items) {
		found_something = found_something || hunt_item(recent_items[i]);
	}
}

function reload() {
	// Wait for a random amount of time, just in case...
	setTimeout(function() {
		window.location.reload();
	}, Math.log(1.0-Math.random()/-1) * time_between_reloads);
}

function main() {
    init_window();

    parse_recent_sales();

    if (found_something && autopurchase) {
        setTimeout(wait_for_purchase, 500);
    } else if (!found_something && autoreload) {
        reload();
    }
}

main();

