/*jslint node: true, sloppy: true, bitwise: true, nomen: true */

/*
Brain.js loads and initializes Senses, Actions, and Behaviors modules.
It also connects to a viewer for perception visualization and manual action control.
*/

global.params = {};
global.params.senses = {};
global.params.actions = {};

var Senses = require('./Senses.js'),
    Actions = require('./Actions.js'),
    Behaviors = require('./Behaviors.js'),
    Viewer = require('./Viewer.js'),
    config = {},
    senses,
    actions,
    behaviors,
    visionWidth,
    visionHeight;

config.manual = (process.argv[3] === "1");
config.virtual = (process.argv[2] === "1");

if (process.argv[4]) {
    visionWidth = +process.argv[4];
} else {
    visionWidth = 128;
}
visionHeight = visionWidth * 3 / 4;

senses = new Senses(visionWidth, visionHeight, config.virtual);
actions = new Actions(senses, config.virtual);
behaviors = new Behaviors(senses, actions, config);

senses.start();
behaviors.start();

viewer = new Viewer(senses, actions, config);

// Code below is to handle exits more gracefully
// From http://stackoverflow.com/questions/14031763/#answer-14032965

process.stdin.resume();

function exitHandler(options, err) {
    if (err) {
        console.log(err.stack);
    }

    actions.dispatch("dc_wheels", "perform", "move", {"type": "stop", "speed": 1.0});

    if (options.exit) {
        process.exit();
    }
}

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
