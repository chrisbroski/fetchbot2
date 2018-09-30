/*jslint node: true */

function Viewer(senses, actions, config) {
    'use strict';

    var fs = require('fs'),
        http = require('http'),
        server = http.createServer(app),
        WebSocketServer = require('websocket').server,
        port = 3791,
        frameCount = 0,
        prevStateString = "",
        manual = false;

    function app(req, rsp) {
        if (req.url === "/img/favicon.png") {
            rsp.writeHead(200, {'Content-Type': 'image/png'});
            fs.createReadStream(__dirname + '/viewer/favicon.png').pipe(rsp);
        } else if (req.url === "/viewer.css") {
            rsp.writeHead(200, {'Content-Type': 'text/css'});
            fs.createReadStream(__dirname + '/viewer/viewer.css').pipe(rsp);
        } else if (req.url === "/viewer.js") {
            rsp.writeHead(200, {'Content-Type': 'application/javascript'});
            fs.createReadStream(__dirname + '/viewer/viewer.js').pipe(rsp);
        } else {
            rsp.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            fs.createReadStream(__dirname + '/viewer/viewer.html').pipe(rsp);
        }
    }

    function sendSenseData() {
        setInterval(function () {
            // var stateString = JSON.stringify(senses.senseState());
            frameCount += 1;

            // if changed, send sense data to viewer 10x per second
            // This needs to accomodate viewer refresh
            // if (stateString !== prevStateString) {
            // prevStateString = stateString;
            // io.emit('senseState', stateString);
            // connection.sendUTF(JSON.stringify({"type": "stateString", "data": senses.senseState()}));
            if (frameCount % 10 === 1) {
                // io.emit('senseRaw', senses.senseRaw());
            }
            // }
        }, 100);
    }

    server.listen(port, function () {
        console.log('Broadcasting to fetchbot viewer at http://0.0.0.0/:' + port);
    });

    var socketServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    socketServer.on('connect', function(connection) {
        console.log('Fetchbot viewer client connected');
    });

    socketServer.on('request', function (request) {
        var connection = request.accept("", request.origin);

        connection.sendUTF(JSON.stringify({"type": "actions", "data": actions.dispatch()}));
        connection.sendUTF(JSON.stringify({"type": "behaviors", "data": global.behaviorTable}));
        connection.sendUTF(JSON.stringify({"type": "getSenseParams", "data": global.tunable.senses}));
        connection.sendUTF(JSON.stringify({"type": "getActionParams", "data": global.tunable.actions}));
        connection.sendUTF(JSON.stringify({"type": "stateString", "data": senses.senseState()}));
        connection.sendBytes(Buffer.from(senses.senseRaw()));

        connection.on('message', function(msg) {
            console.log("Received Message: " + msg.utf8Data);
        });

        connection.on('close', function() {
            console.log("Disconnected.");
        });
    });
}

module.exports = Viewer;
