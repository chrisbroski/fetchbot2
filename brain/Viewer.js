/*jslint node: true */

function Viewer(senses, actions, config) {
    'use strict';

    var fs = require('fs'),
        http = require('http'),
        server = http.createServer(app),
        io = require('socket.io')(server),
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
            var stateString = JSON.stringify(senses.senseState());
            frameCount += 1;

            // if changed, send sense data to viewer 10x per second
            // This needs to accomodate viewer refresh
            // if (stateString !== prevStateString) {
            // prevStateString = stateString;
            io.emit('senseState', stateString);
            if (frameCount % 10 === 1) {
                io.emit('senseRaw', senses.senseRaw());
            }
            // }
        }, 100);
    }

    io.on('connection', function (socket) {
        console.log('Fetchbot viewer client connected');

        io.emit('actions', JSON.stringify(actions.dispatch()));
        io.emit('behaviors', JSON.stringify(global.behaviorTable));
        io.emit('getSenseParams', JSON.stringify(global.params.senses));
        io.emit('getActionParams', JSON.stringify(global.params.actions));
        sendSenseData();

        socket.on("action", function (actionData) {
            var actionArray = JSON.parse(actionData);
            actions.dispatch(actionArray[0], actionArray[1], actionArray[2], actionArray[3]);
        });

        socket.on('control', function (controlType) {
            global.config.manual = (controlType === 'manual');
        });

        /*socket.on('btable', function (btable) {
            behaviors.updateBTable(JSON.parse(btable));
        });*/

        socket.on('setsenseParam', function (senseParams) {
            var arrayParams = senseParams.split(",");
            global.params.senses[arrayParams[0]][arrayParams[1]] = +arrayParams[2];
            senses.perceive();
        });

        socket.on('setactionParam', function (actionParams) {
            var arrayParams = actionParams.split(",");
            global.params.actions[arrayParams[0]][arrayParams[1]] = +arrayParams[2];
        });

        socket.on('disconnect', function () {
            console.log('Fetchbot viewer client disconnected');
        });
    });

    server.listen(port, function () {
        console.log('Broadcasting to fetchbot viewer at http://0.0.0.0/:' + port);
    });
}

module.exports = Viewer;
