function Senses(visionWidth, visionHeight, game) {
    'use strict';

    // Import libraries
    var spawn = require('child_process').spawn,
        Fetchbot = require('./sense/Fetchbot.js'),
        fetchbot = new Fetchbot(),
        Time = require('./sense/Time.js'),
        time = new Time(),

        // Declare private objects
        raw = {},
        state = {},
        observers = {},
        perceivers = {},
        attention = {},
        // moods,
        imgPixelSize = visionWidth * visionHeight,
        imgRawFileSize = imgPixelSize * 1.5,
        partialImgData = '';

    // *Raw* state is unprocessed environment measurements received from sensors.
    // Raw state can only be written by observers and only read by perceivers
    raw.luma = {current: [], previous: []};
    raw.chroma = {U: [], V: []};

    // *Sense state* is a collection of all current sensory data.

    // *current action* indicates what the creature is doing
    state.currentAction = {};// ["", "", {}];

    // Detectors are booleans used to initiate behaviors
    state.detectors = {};

    // *Perceptions* are the results of processing raw sense state
    // They can only be written by perceivers, but can be read by anything
    state.perceptions = {
        dimensions: [visionWidth, visionHeight],
        // brightnessOverall: 0.0,
        targetDirection: [0, 0, 0],
        brightRed: [],
        edges: []
    };

    // Sense state is publically readable (but not changeable).
    this.senseState = function (type) {
        if (type) {
            // Whoa whoa - shouldn't I be passing `currentAction` into this from Actions?
            if (type === 'mood' || type === 'currentAction') {
                return JSON.parse(JSON.stringify(state[type]));
            }
            return JSON.parse(JSON.stringify(state.perceptions[type]));
        }
        return JSON.parse(JSON.stringify(state));
    };

    function downSampleToStream(data, newWidth) {
        var newData, ii, x, iX, y, iY, width, newVal, newLength;
        newData = [];
        width = Math.ceil(visionWidth / newWidth);
        newLength = newWidth * newWidth * 3 / 4;

        for (ii = 0; ii < newLength; ii += 1) {
            x = ii % newWidth * width;
            y = Math.floor(ii / newWidth) * width;

            newVal = 0;
            for (iY = y; iY < width + y; iY += 1) {
                for (iX = x; iX < width + x; iX += 1) {
                    newVal += data[iY * visionWidth + iX];
                }
            }
            newData[ii] = Math.floor(newVal / (width * width));
        }

        return Buffer.from(newData);
    }

    this.senseRaw = function () {
        // return JSON.stringify({"luma": raw.luma.current, "chromaU": raw.chroma.U, "chromaV": raw.chroma.V});
        return JSON.stringify(downSampleToStream(raw.luma.current, 64));
    };

    // *current action* can be modified by the Actions module
    this.currentAction = function currentAction(action, type, name, params) {
        state.currentAction[action] = [type, name, params];
    };

    /*moods = {
        searching: 60,
        chasing: 60,
        stuck: 30,
        relaxing: 60,
        sleepy: 300
    };

    function hasMood(moodType) {
        var ii, len = state.mood.length;
        for (ii = 0; ii < len; ii += 1) {
            if (moodType === state.mood[ii].name) {
                return ii;
            }
        }
        return -1;
    }

    function cleanupMoods() {
        var ii, len = state.mood.length, currentTime = +(new Date());
        for (ii = len - 1; ii > -1; ii -= 1) {
            if (state.mood[ii].expires < currentTime) {
                state.mood.splice(ii, 1);
            }
        }
    }

    this.mood = function mood(moodType) {
        var moodIndex, expTime;
        // if no type is given, return a list of available types and parameters
        if (!moodType) {
            return moods;
        }

        // if not a legal mood, return false
        if (!moods[moodType]) {
            return false;
        }

        moodIndex = hasMood(moodType);
        expTime = +(new Date()) + (moods[moodType] * 1000);

        if (moodIndex > -1) {
            state.mood[moodIndex].expires = expTime;
        } else {
            state.mood.push({"name": moodType, "expires": expTime});
        }
    };*/

    function detectors() {
        state.detectors.reddot = !!state.perceptions.targetDirection.some(function (dir) {
            return (dir > 0);
        });
        // state.detectors.lowLight = (state.perceptions.brightnessOverall < 0.1);
    }

    function perceive() {
        // state.perceptions.brightnessOverall = raw.brightness / imgPixelSize / 256;
        perceivers.frogEye(imgPixelSize);
        detectors();
    }
    this.perceive = perceive;

    // *Perceivers* process raw sense state into meaningful information
    perceivers.frogEye = function () {
        state.perceptions.edges = fetchbot.searchEdges(raw.luma.current, imgPixelSize, visionWidth);
        state.perceptions.brightRed = fetchbot.searchBrightRed(raw.chroma.V, visionWidth / 2, raw.luma.current);
        state.perceptions.targetDirection = fetchbot.redColumns(visionWidth / 2);
        state.perceptions.generalIllumination = fetchbot.generalBrightness(raw.luma.current, imgPixelSize, visionWidth);
    };

    // *Observers* populate raw sense state from a creature's sensors.
    observers.vision = function (yuvData) {
        var lumaData = [],
            chromaU = [],
            chromaV = [],
            ii;

        raw.brightness = 0;

        // The Pi camera gives a lot of crap data in yuv time lapse mode.
        // This recovers some of it
        if (yuvData.length < imgRawFileSize - 1) {
            if (yuvData.length + partialImgData.length === imgRawFileSize) {
                yuvData = Buffer.concat([partialImgData, yuvData], imgRawFileSize);
            } else {
                partialImgData = yuvData;
                return;
            }
        }
        partialImgData = '';

        // Data conversion. In this case an array is built from part of a binary buffer.
        for (ii = 0; ii < imgPixelSize; ii += 1) {
            lumaData.push(yuvData.readUInt8(ii));
            raw.brightness += yuvData.readUInt8(ii);
        }
        for (ii = imgPixelSize; ii < imgPixelSize * 1.25; ii += 1) {
            chromaU.push(yuvData.readUInt8(ii));
        }
        for (ii = imgPixelSize * 1.25; ii < imgPixelSize * 1.5; ii += 1) {
            chromaV.push(yuvData.readUInt8(ii));
        }

        // Set raw global sense state
        raw.luma.previous = raw.luma.current;
        raw.luma.current = lumaData;
        raw.chroma.U = chromaU;
        raw.chroma.V = chromaV;

        /*
        Perceivers should typically be handled by the attention object as a separate
        process, but for simplicity we'll just fire them off after the observer completes.
        */
        perceive();
    };

    // Other observers can be added here for sound, temperature, velocity, smell, whatever.

    // *Attention* is responsible for triggering observers and perceivers.
    attention = {};
    attention.look = function (timeLapseInterval) {
        var cam;

        timeLapseInterval = timeLapseInterval || 0;

        if (game) {
            game.play(observers);
        } else {
            cam = spawn('raspiyuv', [
                '-w', visionWidth.toString(10),
                '-h', visionHeight.toString(10),
                //'-p', '50, 80, 400, 300', // small preview window
                '--nopreview',
                '-awb', 'fluorescent', // color detection more consistent
                '-bm', // Burst mode - this causes a significant improvement in frame rate
                '-rot', '90', // My camera is sideways so rotate the image
                '-tl', timeLapseInterval.toString(10), // 0 = as fast as possible
                '-t', '300000', // Restart every 5 min
                '-o', '-' // To stdout
            ]);

            cam.stdout.on('data', function (data) {
                observers.vision(data);
            });

            cam.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
            });

            cam.on('exit', function (code) {
                console.log('raspiyuv process exited with code ' + code);
                console.log('Restarting raspiyuv time lapse');
                attention.look(250);
            });
        }
    };

    attention.time = function () {
        // Wait, should detectors be with their sense?
        state.detectors.longTimeSinceRed = (global.tunable.senses.since.red < time.sinceRed());
        setTimeout(attention.time, 5000);
    };
    attention.time();

    this.start = function init() {
        console.log('Initialize senses module');
        attention.look(250);
        // setInterval(cleanupMoods, 5000);
    };
}

module.exports = Senses;
