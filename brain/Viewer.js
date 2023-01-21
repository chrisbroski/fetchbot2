function Viewer(senses, actions) {
    'use strict';

    var fs = require('fs'),
        http = require('http'),
        server = http.createServer(app),
        WebSocketServer = require('websocket').server,
        port = 3791,
        frameCount = 0;

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

    server.listen(port, function () {
        console.log('Broadcasting to fetchbot viewer at http://0.0.0.0:' + port);
    });

    var socketServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    function init() {
        socketServer.on('connect', function() {
            console.log('Fetchbot viewer client connected');
        });

        socketServer.on('request', function (request) {
            var connection = request.accept("", request.origin);

            function sendJson(type, data) {
                connection.sendUTF(JSON.stringify({"type": type, "data": data}));
            }

            function sendSenseData() {
                setInterval(function () {
                    frameCount += 1;
                    sendJson("stateString", senses.senseState());
                    if (frameCount % 10 === 1) {
                        connection.sendBytes(Buffer.from(senses.senseRaw()));
                    }
                }, 100);
            }

            sendJson("actions", actions.dispatch());
            sendJson("behaviors", global.behaviorTable);
            sendJson("getSenseParams", global.tunable.senses);
            sendJson("getActionParams", global.tunable.actions);
            sendSenseData();

            connection.on("message", function (msg) {
                var jsonMsg = JSON.parse(msg.utf8Data);
                if (jsonMsg.type === "action") {
                    actions.dispatch(jsonMsg.data[0], jsonMsg.data[1], jsonMsg.data[2], jsonMsg.data[3]);
                }
                if (jsonMsg.type === "control") {
                    global.config.manual = (jsonMsg.data === 'manual');
                    console.log("Manual control: ", global.config.manual);
                }
                if (jsonMsg.type === "setsenseParam") {
                    global.tunable.senses[jsonMsg.data[0]][jsonMsg.data[1]] = +jsonMsg.data[2];
                    senses.perceive();
                }
                if (jsonMsg.type === "setactionParam") {
                    global.tunable.actions[jsonMsg.data[0]][jsonMsg.data[1]] = +jsonMsg.data[2];
                    senses.perceive();
                }
            });

            /*socket.on('btable', function (btable) {
                behaviors.updateBTable(JSON.parse(btable));
            });*/

            connection.on('close', function() {
                console.log("Disconnected.");
            });
        });
    }

    this.start = init;
}

module.exports = Viewer;
