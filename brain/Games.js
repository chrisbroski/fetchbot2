/*jslint node: true, bitwise: true */

function Games() {
    'use strict';

    var fs = require("fs"),
        photo = "/games/find-dot-128/reddot-128.raw",
        observe;

    function play(observers) {
        observe = observers.vision;
        show();
    }

    function show() {
        fs.readFile(__dirname + photo, function (err, data) {
            if (err) {
                throw err;
            }
            observe(data);
        });
    }

    function act() {
        photo = "/games/find-dot-128/reddot-128.raw";
        show();
    }

    this.play = play;
    this.show = show;
    this.act = act;
}

module.exports = Games;
