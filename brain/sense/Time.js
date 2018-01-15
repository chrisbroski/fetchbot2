/*jslint node: true */

global.params.senses.since = {};
global.params.senses.since.red = 300;

function Time() {
    "use strict";

    var lastRed;

    this.markRed = function markRed() {
        lastRed = +(new Date());
    };

    this.sinceRed = function sinceRed() {
        var now = +(new Date());
        return (now - lastRed) / 1000;
    };

    this.markRed();
}

module.exports = Time;