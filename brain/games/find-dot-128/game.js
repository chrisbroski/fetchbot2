function Game() {
    'use strict';

    var fs = require("fs"),
        observers,
        activePhoto = 0,
        timer;

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
        // activePhoto = circle(Math.floor(Math.random() * 7));
        activePhoto = 1;
        show(`view${activePhoto}.raw`);
    }

    function turn(typeParamRight4) {
        if (timer) {
            clearTimeout(timer);
        }
        if (typeParamRight4 === 'ight' || typeParamRight4 === 'left') {
            if (typeParamRight4 === 'ight') {
                activePhoto = circle(activePhoto - 1);
            } else {
                activePhoto = circle(activePhoto + 1);
            }

            show(`view${activePhoto}.raw`);
            timer = setTimeout(turn.bind(null, typeParamRight4), 3000);
        }
    }

    function act(actionData) {
        if (actionData.action === 'dc_wheels' && actionData.act === 'move') {
            turn(actionData.params.type.slice(-4));
        }
    }

    this.play = play;
    this.act = act;
}

module.exports = Game;
