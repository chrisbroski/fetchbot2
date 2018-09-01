/*jslint node: true, bitwise: true */

var behaviorTable = require("./behavior/behaviorTable.json");

function Behaviors(senses, actions, config) {
    'use strict';

    function detectorMatch(situation, detector) {
        var ii, keys = Object.keys(situation), len = keys.length;

        if (len === 0) {
            return false;
        }

        for (ii = 0; ii < len; ii += 1) {
            if (detector[keys[ii]] !== situation[keys[ii]]) {
                return false;
            }
        }
        return true;
    }

    function respond() {
        var bTable, selectedBehavior, response;

        // Skip if under manual control
        if (global.config.manual) {
            return false;
        }

        var mood = senses.senseState("currentAction");//["mood"];
        if (mood.mood && mood.mood.length > 1 && behaviorTable[mood.mood[1]]) {
            bTable = behaviorTable[mood.mood[1]];
        } else {
            bTable = behaviorTable[Object.keys(behaviorTable)[0]];
        }
        selectedBehavior = bTable.find(function (behavior) {
            return (detectorMatch(behavior.situation, senses.senseState().detectors));
        });
        if (!selectedBehavior) {
            // Let's assume the first behavior is the default
            selectedBehavior = bTable[0];
        }
        response = selectedBehavior.response;

        // Maneuvers don't require an act
        if (response.length === 1) {
            response.push("");
        }
        // params are optional
        if (response.length === 2) {
            response.push({});
        }

        actions.dispatch(response[0], response[1], response[2], response[3]);
    }

    /*this.updateBTable = function updateBTable(newBTable) {
        global.behaviorTable = newBTable;
    };*/

    this.start = function init() {
        global.behaviorTable = behaviorTable;
        setInterval(respond, 200);
    };
}

module.exports = Behaviors;
