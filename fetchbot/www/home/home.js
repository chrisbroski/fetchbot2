/*jslint browser: true */
/*global aero */

aero.touchclick(document.getElementById("exampleDialog"), function () {
    "use strict";
    aero.showDialog(document.querySelector("div.dialog"));
});
