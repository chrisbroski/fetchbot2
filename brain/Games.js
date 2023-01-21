function Games(gameName) {
    'use strict';

    var fs = require("fs"),
        Games,
        game;

    // Load game
    if (!gameName) {
        // Set a default, if you want
        gameName = "dot-128";
    }
    try {
        Games = require(`./games/${gameName}/game.js`);
    } catch (e) {
        console.log(`game '${gameName}' not found.`);
        console.log("valid game names are: ");
        games();
        process.exit();
    }

    game = new Games();

    function games() {
        console.log("    ", fs.readdirSync(`${__dirname}/games/`).filter((f) => {
            return f !== ".DS_Store";
        }).join(", "));
    }

    this.play = game.play;
    this.act = game.act;
    this.games = games;
}

module.exports = Games;
