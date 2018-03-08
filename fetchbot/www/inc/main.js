/*jslint browser: true */
/*global Aerophane */

var aero;

(function init() {
    "use strict";

    if (aero) {
        return;
    }

    aero = new Aerophane("Aerophane", [
        {"name": "Home", "href": "../home/home.html"},
        {"name": "List", "href": "../list/list.html"},
        {"name": "Tabs", "href": "../tabs/tabs.html"},
        {"name": "Form", "href": "../form/form.html"}
    ]);

}());
