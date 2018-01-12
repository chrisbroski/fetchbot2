/*jslint node: true */

function Led(senses, virtual) {
    "use strict";

    var Gpio, red, green, blue;

    this.perform = {};
    this.maneuver = {};

    this.perform.red = function () {
        red.digitalWrite(1);
        green.digitalWrite(0);
        blue.digitalWrite(0);
    };

    this.perform.green = function () {
        red.digitalWrite(0);
        green.digitalWrite(1);
        blue.digitalWrite(0);
    };

    this.perform.blue = function () {
        red.digitalWrite(0);
        green.digitalWrite(0);
        blue.digitalWrite(1);
    };

    function init() {
        if (!virtual) {
            Gpio = require('pigpio').Gpio;
            red = new Gpio(19, {mode: Gpio.OUTPUT});
            green = new Gpio(29, {mode: Gpio.OUTPUT});
            blue = new Gpio(16, {mode: Gpio.OUTPUT});
        }
    }

    init();
}

module.exports = Led;
