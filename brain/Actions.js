/*jslint node: true */

function Actions(senses, virtual) {
    'use strict';

    // Action performers
    var DcWheels = require('./action/DcWheels.js'),
        dcwheels = new DcWheels(senses, virtual),
        perform = {},
        maneuver = {};

    perform.mood = function mood(params) {
        if (!params) {
            return [
                {
                    description: 'type',
                    options: [
                        'searching',
                        'relaxing',
                        'chasing'
                    ],
                    auto: 'searching'
                },
                {
                    description: 'duration',
                    val: [
                        0,
                        86400
                    ],
                    auto: 60
                }
            ];
        }
        senses.mood(params.type);
    };

    // Set up performers and maneuvers from libraries
    perform.move = dcwheels.perform.move;
    maneuver.chase = dcwheels.maneuver.chase;
    maneuver.search = dcwheels.maneuver.search;

    this.dispatch = function actionDispatch(actType, act, params) {
        params = params || {};

        var actions = {},
            currentAction,
            newAction,
            maneuverPerform;

        // if no action is given, return a list of available types and parameters
        if (!actType) {
            actions.perform = {};
            actions.maneuver = {};
            Object.keys(perform).forEach(function (a) {
                actions.perform[a] = perform[a]();
            });

            Object.keys(maneuver).forEach(function (a) {
                actions.maneuver[a] = a;
            });

            return JSON.parse(JSON.stringify(actions));
        }

        // log only if action is different
        // Should we only execute if different too?
        currentAction = JSON.stringify(senses.senseState().currentAction);
        if (actType !== "perform" && actType !== "manual") {
            maneuverPerform = maneuver[actType]();
            act = maneuverPerform[0];
            params = maneuverPerform[1];
        }
        newAction = JSON.stringify([actType, act, params]);
        if (currentAction !== newAction) { // if not current action
            senses.currentAction(actType, act, params);
            console.log(actType, act, params);
        }

        // Execute action
        if (!virtual) {
            perform[act](params);
        }
    };
}

module.exports = Actions;
