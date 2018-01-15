/*jslint node: true */

function Led(senses, virtual) {
    "use strict";

    var Gpio, red, green, blue, color = {}, lightParams;

    this.perform = {};
    this.maneuver = {};

    color.off = [0, 0, 0];
    color.red = [1, 0, 0];
    color.green = [0, 1, 0];
    color.blue = [0, 0, 1];

    lightParams = [
        {
            description: "type",
            values: [
                "off",
                "red",
                "green",
                "blue"
            ],
            auto: "off"
        }
    ];

    function light(params) {
        var colors;

        if (!params) {
            return lightParams;
        }

        colors = color[params.type];
        red.digitalWrite(colors[0]);
        green.digitalWrite(colors[1]);
        blue.digitalWrite(colors[2]);
    }
    this.perform.light = light;

    function init() {
        if (!virtual) {
            Gpio = require('pigpio').Gpio;
            red = new Gpio(26, {mode: Gpio.OUTPUT});
            green = new Gpio(12, {mode: Gpio.OUTPUT});
            blue = new Gpio(16, {mode: Gpio.OUTPUT});
            light({"type": "off"});
        }
        senses.currentAction("led", "perform", "light", {"type": "off"});
    }

    init();
}

module.exports = Led;
