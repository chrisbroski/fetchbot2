/*jslint node: true, sloppy: true, bitwise: true, nomen: true */

/*
Brain.js loads and initializes Senses, Actions, and Behaviors modules.
It also connects to a viewer for perception visualization and manual action control.
*/

global.params = {};
global.params.senses = {};
global.params.actions = {};
global.config = {"manual": false};

var Senses = require('./Senses.js'),
    Actions = require('./Actions.js'),
    Behaviors = require('./Behaviors.js'),
    Viewer = require('./Viewer.js'),
    Games = require('./Games.js'),
    config = {},
    senses,
    actions,
    behaviors,
    viewer,
    games,
    cli_position,
    supported_widths = ['32', '64', '128', '256'];

config.game = false;
config.visionWidth = 128;
config.visionHeight = 96;

// Set up CLI interface
if (process.argv.indexOf("-v") > -1 || process.argv.indexOf("--version") > -1) {
    console.log(require('../package.json').version);
    process.exit();
}

if (process.argv.indexOf("-h") > -1 || process.argv.indexOf("--help") > -1) {
    console.log(`
DESCRIPTION

    Fetchbot is a system of robot behavior intended as a basic
    starting point, and to research application architecture.

ARGUMENTS

    --version, -v       Version of npm package

    --game, -g <game>   Start brain in game mode. If more than one
                        game is available, list supported games.

    --manual, -m        Start brain in manual control mode

    --width, -w         Run brain with specified visual resolution
                        (default 128) If an unsupported resolution
                        is specified, list valid parameters

    --help, -h          This documentation
    `);
    process.exit();
}

if (process.argv.indexOf("-m") > -1 || process.argv.indexOf("--manual") > -1) {
    global.config.manual = true;
}

if (process.argv.indexOf("-g") > -1 || process.argv.indexOf("--game") > -1) {
    // there could be multiple game types if the argument is not a flag
    // if more than one and none is specified, return a list of valid games
    config.game = true;
    games = new Games();
}

cli_position = process.argv.indexOf("-w");
if (cli_position === -1) {
    cli_position = process.argv.indexOf("--visionwidth");
}
if (cli_position > -1) {
    if (supported_widths.indexOf(process.argv[cli_position]) > -1) {
        config.visionWidth = +process.argv[cli_position + 1];
        config.visionHeight = config.visionWidth * 3 / 4;
    } else {
        console.log("Supported vision widths: ", supported_widths.join(", "));
        process.exit();
    }
}

senses = new Senses(config.visionWidth, config.visionHeight, games);
actions = new Actions(senses, config.game);
behaviors = new Behaviors(senses, actions, config);

senses.start();
behaviors.start();

viewer = new Viewer(senses, actions, config);
viewer.start();

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
