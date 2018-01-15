/*jslint node: true */

function Actions(senses, virtual) {
    'use strict';

    // Action performers
    var DcWheels = require('./action/DcWheels.js'),
        dcwheels = new DcWheels(senses, virtual),
        Mood = require('./action/Mood.js'),
        mood = new Mood(senses),
        Led = require('./action/Led.js'),
        led = new Led(senses, virtual),
        actions = {"dc_wheels": {}, "mood": {}, "led": {}};

    // Set up performers and maneuvers from libraries
    actions.dc_wheels.perform = {};
    actions.dc_wheels.perform.move = dcwheels.perform.move;
    actions.dc_wheels.maneuver = {};
    actions.dc_wheels.maneuver.chase = dcwheels.maneuver.chase;
    actions.dc_wheels.maneuver.search = dcwheels.maneuver.search;

    actions.mood.perform = {};
    actions.mood.maneuver = {};
    actions.mood.perform.setMood = mood.perform.setMood;

    actions.led.perform = {};
    actions.led.maneuver = {};
    actions.led.perform.light = led.perform.light;

    this.dispatch = function actionDispatch(action, actType, act, params) {
        params = params || {};

        var actionDocs = {},
            currentAction,
            newAction,
            maneuverPerform;

        // if no action is given, return a list of available types and parameters
        if (!action) {
            Object.keys(actions).forEach(function (a) {
                actionDocs[a] = {};
                actionDocs[a].perform = {};
                actionDocs[a].maneuver = {};

                Object.keys(actions[a].perform).forEach(function (p) {
                    actionDocs[a].perform[p] = actions[a].perform[p]();
                });

                Object.keys(actions[a].maneuver).forEach(function (m) {
                    actionDocs[a].maneuver[m] = m;
                });
            });

            return JSON.parse(JSON.stringify(actionDocs));
        }

        // log only if action is different
        // Should we only execute if different too?
        currentAction = JSON.stringify(senses.senseState("currentAction")[action]);
        if (actType !== "perform" && actType !== "manual") { // is a maneuver
            maneuverPerform = actions[action].maneuver[actType]();
            act = maneuverPerform[0];
            params = maneuverPerform[1];
        }
        newAction = JSON.stringify([actType, act, params]);
        if (currentAction !== newAction) { // if not current action
            senses.currentAction(action, actType, act, params);
            console.log(action, actType, act, params);
        }

        // Execute action
        if (!virtual) {
            actions[action].perform[act](params);
        }
    };
}

module.exports = Actions;
