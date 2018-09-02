/*jshint esversion: 6 */
/*jshint strict: true */
/*jslint unused: true */

function Game() {
    'use strict';

    var fs = require("fs"),
        observers,
        activePhoto = 0;

    function circle(idx) {
        if (idx > 7) {
            idx = 0;
        }
        if (idx < 0) {
            idx = 7;
        }
        return idx;
    }

    function show(photo) {
        fs.readFile(`${__dirname}/${photo}`, function (err, data) {
            if (err) {
                throw err;
            }
            observers.vision(data);
        });
    }

    function play(senseObservers) {
        observers = senseObservers;
        activePhoto = circle(Math.floor(Math.random() * 7));
        show(`view${activePhoto}.raw`);
    }

    function act(actionData) {
        if (actionData.action === 'dc_wheels' && actionData.act === 'move') {
            if (actionData.params.type.slice(-4) === 'ight') {
                activePhoto = circle(activePhoto + 1);
            }
            if (actionData.params.type.slice(-4) === 'left') {
                activePhoto = circle(activePhoto - 1);
            }
        }
        show(`view${activePhoto}.raw`);
    }

    this.play = play;
    this.act = act;
}

module.exports = Game;
