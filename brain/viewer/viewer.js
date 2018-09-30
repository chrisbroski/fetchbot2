/*jslint browser: true, sloppy: true */
/*global io */

var socket, control = 'auto', detectors, actionData, mood, /*editingBehavior,*/ viz = {};

viz.dimensions = {};
viz.canvasWidth = 384;
viz.canvasHeight = 288;

viz.layers = {};
viz.layers.luma = {type: "raw"};
viz.layers.luma.color = function (val) {
    return "rgba(" + val + ", " + val + ", " + val + ", 0.5)";
};
viz.layers.edges = {color: [0, 0, 0, 0.8]};
viz.layers.brightRed = {color: [255, 0, 0, 0.5], downsample: 2};

function disableControlButtons(disOrEnable) {
    var buttons = document.querySelectorAll('#controls button, #actions button'), ii, len;
    len = buttons.length;
    for (ii = 0; ii < len; ii += 1) {
        buttons[ii].disabled = disOrEnable;
    }
}

function setControl(autoOrManual) {
    var controlButton = document.querySelector("#manual button");

    control = autoOrManual;
    if (control === "manual") {
        document.querySelector('#manual button').innerHTML = "Relinquish control";
        disableControlButtons(false);
        // document.getElementById("display-action-type").textContent = "manual";
    } else {
        document.querySelector("#manual button").innerHTML = "Request manual control";
        // document.getElementById("display-action-type").textContent = "";
        disableControlButtons(true);
    }

    controlButton.disabled = false;
}

function describeAction(action) {
    Object.keys(action).forEach(function (a) {
        var caPre = document.querySelector('#actions fieldset[data-action="' + a + '"] pre');
        caPre.textContent = action[a][0] + "\n" + action[a][1] + ": " + JSON.stringify(action[a][2]);
        //console.log(a, action[a]);
        if (a === "mood") {
            mood = action[a][1];
        }
    });
}

function paintRaw(v, dots) {
    var ctx = viz.layers[v].ctx,
        mag = viz.canvasWidth / 64;

    ctx.clearRect(0, 0, viz.canvasWidth, viz.canvasHeight);
    dots.forEach(function (dot, index) {
        var x = (index % 64) * mag,
            y = (Math.floor(index / 64)) * mag;

        ctx.fillStyle = viz.layers[v].color(dot);
        ctx.beginPath();
        ctx.fillRect(x, y, mag, mag);
        ctx.closePath();
        ctx.fill();
    });
}

function displayRaw(raw) {
    raw = JSON.parse(raw);
    paintRaw("luma", raw);
}

function clearDetectors() {
    var detectorRadios = document.querySelectorAll('#behaviorEdit div:first-child input[type="radio"]');
    Array.from(detectorRadios).forEach(function (cb) {
        cb.checked = !cb.value;
    });
    document.querySelector(".action-type").selectedIndex = 0;
}

function createRadio(name, val) {
    var detectorLabel = document.createElement("label"),
        detectorInput = document.createElement("input");

    detectorInput.type = "radio";
    detectorInput.name = "di-" + name;
    detectorInput.value = val;
    detectorInput.checked = true;
    detectorLabel.appendChild(detectorInput);
    detectorLabel.appendChild(document.createTextNode(val || "N/A"));

    return detectorLabel;
}

function displayDetectors(ds) {
    var detectorArea,
        detectorRow;

    detectorArea = document.querySelector("#behaviorEdit div");
    Object.keys(ds).forEach(function (d) {
        detectorRow = document.createElement("div");
        detectorRow.setAttribute("data-detector", d);
        detectorRow.className = "data-detector";

        detectorRow.appendChild(createRadio(d, ""));
        detectorRow.appendChild(createRadio(d, "1"));
        detectorRow.appendChild(createRadio(d, "0"));
        detectorRow.appendChild(document.createTextNode(d));
        detectorArea.appendChild(detectorRow);
    });
}

function paintViz(v, dots) {
    var ctx = viz.layers[v].ctx,
        downsample = viz.layers[v].downsample || 1,
        mag = downsample * viz.canvasWidth / viz.dimensions.imageWidth,
        width =  viz.dimensions.imageWidth / downsample;

    ctx.clearRect(0, 0, viz.canvasWidth, viz.canvasHeight);

    dots.forEach(function (dot) {
        var x = (dot % width) * mag,
            y = (Math.floor(dot / width)) * mag;

        ctx.beginPath();
        ctx.fillRect(x, y, mag, mag);
        ctx.closePath();
        ctx.fill();
    });
}

function createRule(w, h) {
    viz.dimensions.imageWidth = w;
    viz.dimensions.imageHeight = h;

    document.getElementById("x-rule-1").textContent = (w / 4).toFixed();
    document.getElementById("x-rule-2").textContent = (w / 2).toFixed();
    document.getElementById("x-rule-3").textContent = (w * 3 / 4).toFixed();
    document.getElementById("x-rule-4").textContent = w.toFixed();

    document.getElementById("y-rule-1").textContent = (h / 4).toFixed();
    document.getElementById("y-rule-2").textContent = (h / 2).toFixed();
    document.getElementById("y-rule-3").textContent = (h * 3 / 4).toFixed();
    document.getElementById("y-rule-4").textContent = h.toFixed();
}

function senseStateReceived(jsonState) {
    var jsonString;

    if (!detectors) {
        detectors = true;
        displayDetectors(jsonState.detectors);
    }

    // I could check to see if this changed before doing useless DOM manipulation
    describeAction(jsonState.currentAction);
    delete jsonState.currentAction;
    jsonString = JSON.stringify(jsonState, null, '    ');

    document.querySelector('#senseState').innerHTML = jsonString;
    if (!viz.dimensions.imageWidth) {
        createRule(jsonState.perceptions.dimensions[0], jsonState.perceptions.dimensions[1]);
    }

    // Paint visualisations
    Object.keys(viz.layers).forEach(function (v) {
        if (viz.layers[v].type !== "raw") {
            paintViz(v, jsonState.perceptions[v]);
        }
    });
}

function isSelectedParam(paramDesc, selectedParams) {
    if (!selectedParams) {
        return false;
    }
    return (paramDesc === selectedParams.type);
}

function displayActionParams(selectedParams) {
    var actionType = document.querySelector(".action-type").value,
        actionParam = document.getElementById("action-param"),
        actionInfo = actionType.split("-"),
        paramData = actionData.dc_wheels[actionInfo.shift()][actionInfo.join("-")],
        paramLabel,
        paramInput,
        paramOption;

    actionParam.innerHTML = "";
    if (typeof paramData === "string") {
        return;
    }
    paramData.forEach(function (param) {
        paramLabel = document.createElement("label");
        paramLabel.setAttribute("data-action-param", param.description);
        paramLabel.textContent = param.description;
        if (param.values) {
            paramInput = document.createElement("select");
            param.values.forEach(function (val) {
                paramOption = document.createElement("option");
                paramOption.textContent = val;
                paramOption.value = val;
                if (isSelectedParam(val, selectedParams)) {
                    paramOption.selected = true;
                }
                paramInput.appendChild(paramOption);
            });
        } else if (param.options) {
            paramInput = document.createElement("select");
            param.options.forEach(function (val) {
                paramOption = document.createElement("option");
                paramOption.textContent = val;
                paramOption.value = val;

                if (isSelectedParam(val, selectedParams) || param.auto === val) {
                    paramOption.selected = true;
                }
                paramInput.appendChild(paramOption);
            });
        } else {
            paramInput = document.createElement("input");
            paramInput.setAttribute("type", "number");

            if (selectedParams && selectedParams[param.description]) {
                paramInput.value = selectedParams[param.description];
            } else {
                paramInput.value = param.auto;
            }

            paramInput.setAttribute("min", param.val[0]);
            paramInput.setAttribute("max", param.val[1]);
            if (param.val[0] === 0.0 && param.val[1] === 1.0) {
                paramInput.setAttribute("step", "0.01");
            }

        }
        paramLabel.appendChild(paramInput);
        actionParam.appendChild(paramLabel);
    });
}

function isActParamsValues(params) {
    return params.find(function (param) {
        return param.values;
    });
}

function manualAction() {
    var actGroup = this.parentElement,
        actSection = actGroup.parentElement,
        actLib = actSection.getAttribute("data-action"),
        actType = actGroup.getAttribute("data-action-type"),
        paramInputs = actGroup.getElementsByTagName("input"),
        paramSelects = actGroup.getElementsByTagName("select"),
        actName = this.textContent,
        paramData = {};

    Array.from(paramSelects).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = inp.value;
    });
    Array.from(paramInputs).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = +inp.value;
    });
    if (this.getAttribute("data-action")) {
        paramData[this.getAttribute("data-action-param")] = actName;
        actName = this.getAttribute("data-action");
    }

    // socket.emit("action", JSON.stringify([actLib, actType, actName, paramData]));
    socket.send(JSON.stringify({"type": "action", "data": [actLib, actType, actName, paramData]}));
}

function actionParamFragment(act, params) {
    var actFragment = document.createDocumentFragment(),
        label,
        button,
        select,
        option,
        input,
        isButtonSeries = params.some(function (param) {return param.values; });

    params.forEach(function (param, index) {
        if (index === 0 && !isButtonSeries) {
            button = document.createElement("button");
            button.textContent = act;
            button.onclick = manualAction;
            button.disabled = true;
            actFragment.appendChild(button);
        }

        if (param.values) {
            // This is got a "button set"
            param.values.forEach(function (val) {
                button = document.createElement("button");
                button.textContent = val;
                button.setAttribute("data-action", act);
                button.setAttribute("data-action-param", param.description);
                button.onclick = manualAction;
                button.disabled = true;
                actFragment.appendChild(button);
            });
        }
        if (param.options) {
            select = document.createElement("select");
            select.setAttribute("data-action-param", param.description);
            param.options.forEach(function (opt) {
                option = document.createElement("option");
                option.textContent = opt;
                option.value = opt;
                select.appendChild(option);
            });
            actFragment.appendChild(select);
        }
        if (param.val) {
            label = document.createElement("label");
            label.textContent = param.description;
            input = document.createElement("input");
            input.setAttribute("type", "number");
            input.setAttribute("data-action-param", param.description);
            input.value = param.auto;
            input.setAttribute("min", param.val[0]);
            input.setAttribute("max", param.val[1]);
            if (param.val[0] === 0.0 && param.val[1] === 1.0) {
                input.setAttribute("step", "0.01");
            }
            label.appendChild(input);
            actFragment.appendChild(label);
        }
    });

    return actFragment;
}

function displayActionSelect(action) {
    var actionArea = document.createElement("div"),
        areaTitle = document.createElement("h5"),
        actionSelect = document.createElement("select"),
        actionOption,
        actionOptionGroup,
        actionParam = document.createElement("div");

    actionArea.setAttribute("data-action", action);
    areaTitle.textContent = action;
    actionArea.appendChild(areaTitle);

    actionSelect.className = "action-type";
    actionSelect.onchange = displayActionParams;

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "perform";
    Object.keys(actionData[action].perform).forEach(function (act) {
        // Behavior popup
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = "perform-" + act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "maneuver";
    Object.keys(actionData[action].maneuver).forEach(function (act) {
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = "maneuver-" + act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    actionArea.appendChild(actionSelect);
    actionParam.id = "action-param";
    actionArea.appendChild(actionParam);
    document.querySelector("#behaviorActions").appendChild(actionArea);
}

function displayAction(action) {
    var actionSection = document.getElementById("actions"),
        actionArea = document.createElement("fieldset"),
        areaLegend = document.createElement("legend"),
        areaActionType = document.createElement("pre"),
        actionDiv,
        actionH;

    actionArea.setAttribute("data-action", action);
    areaLegend.textContent = action;
    actionArea.appendChild(areaLegend);
    areaActionType.textContent = "perform";
    actionArea.appendChild(areaActionType);

    Object.keys(actionData[action].perform).forEach(function (act) {
        // Actions section
        actionDiv = document.createElement("div");
        actionDiv.setAttribute("data-action-type", "perform");
        actionH = document.createElement("h4");
        actionH.textContent = act;
        actionDiv.appendChild(actionH);
        actionDiv.appendChild(actionParamFragment(act, actionData[action].perform[act]));
        actionArea.appendChild(actionDiv);
    });

    actionSection.appendChild(actionArea);
}

function displayActions() {
    Object.keys(actionData).forEach(function (a) {
        displayAction(a);
        displayActionSelect(a);
    });
}

function populateBehavior(data) {
    clearDetectors();

    var detector = data.slice(0, data.indexOf(" ")),
        response = data.slice(data.indexOf(": ") + 2),
        action = data.slice(data.indexOf("→ ") + 2, data.indexOf(": ")),
        actionOption;

    if (action === "maneuver") {
        actionOption = "maneuver-" + response;
        response = "";
    } else {
        response = JSON.parse(response);
        actionOption = "perform-" + action;
    }

    if (detector !== "default:") {
        document.querySelector('#behaviorEdit div[data-detector="' + detector + '"] input[value="1"]').checked = true;
    } else {
        Array.from(document.querySelectorAll('#behaviorEdit div input[value=""]')).forEach(function (d) {
            d.checked = true;
        });
    }

    // Actions
    document.querySelector(".action-type").value = actionOption;
    if (response) {
        displayActionParams(response);
    } else {
        document.getElementById("action-param").innerHTML = "";
    }

    document.getElementById("behaviorEdit").showModal();
}

function behaviorDisplay(behavior) {
    var detectTrue = [], detectFalse = [], sit;

    Object.keys(behavior.situation).forEach(function (d) {
        if (behavior.situation[d]) {
            detectTrue.push(d);
        } else {
            detectFalse.push(d);
        }
    });
    if (detectTrue.length === 0 && detectFalse.length === 0) {
        sit = "default ";
    } else {
        if (detectTrue.length > 0) {
            sit = detectTrue.join(", ") + " ";
        }
        if (detectFalse.length > 0) {
            sit = sit + "(" + detectFalse.join(", ") + ") ";
        }
    }

    if (behavior.response[1] === "perform") {
        return sit + "→ " + behavior.response[2] + ": " + JSON.stringify(behavior.response[3]);
    }
    return sit + "→ maneuver: " + behavior.response[1];
}
/*
function editBehavior() {
    editingBehavior = this.value;
    populateBehavior(this.textContent);
}*/

function displayBehaviors(behaviorTable) {
    var behaviors,
        bTable = document.getElementById("behaviorTable"),
        bTableRow,
        moodSelect,
        moods,
        option;

    if (behaviorTable) {
        behaviors = behaviorTable.chasing;
    } else {
        behaviors = [];
    }

    // if moods, Build mood dropdown
    if (actionData.mood) {
        //console.log(actionData.mood.perform.setMood[0].options);
        moods = actionData.mood.perform.setMood[0].options;
        moodSelect = document.getElementById("mood-select");
        moods.forEach(function (m) {
            option = document.createElement("option");
            option.value = m;
            option.textContent = m;
            moodSelect.appendChild(option);
        });
    }

    behaviors.forEach(function (behavior, index) {
        bTableRow = document.createElement("option");
        bTableRow.value = index;
        bTableRow.textContent = behaviorDisplay(behavior);
        // bTableRow.ondblclick = editBehavior;
        bTable.appendChild(bTableRow);
    });
}

function manual() {
    var controlButton = document.querySelector('#manual button');

    controlButton.disabled = true;

    if (control === 'auto') {
        controlButton.innerHTML = 'Requesting manual control...';
        socket.send(JSON.stringify({"type": "control", "data": "manual"}));
        setControl('manual');
    } else {
        controlButton.innerHTML = 'Requesting autonomous control...';
        socket.send(JSON.stringify({"type": "control", "data": "auto"}));
        setControl('auto');
    }
}

function displayParams(params, paramType) {
    var paramDiv = document.getElementById(paramType + "Params"),
        fieldset = document.createElement("fieldset");

    // params = JSON.parse(params);

    Object.keys(params).forEach(function (perceiver) {
        var h4 = document.createElement("h4");
        h4.textContent = perceiver;
        fieldset.appendChild(h4);

        Object.keys(params[perceiver]).forEach(function (param) {
            var label = document.createElement("label"),
                input = document.createElement("input"),
                button = document.createElement("button");

            label.textContent = param;
            input.type = "number";

            input.value = params[perceiver][param];
            if (Math.round(params[perceiver][param]) !== params[perceiver][param]) {
                input.setAttribute("step", "0.01");
            }
            input.onchange = function () {
                socket.send(JSON.stringify({"type": "set" + paramType + "Param", "data": [perceiver, param, this.value]}));
            };

            button.type = "button";
            button.textContent = "Update";

            label.appendChild(input);
            label.appendChild(button);
            fieldset.appendChild(label);
        });

        paramDiv.appendChild(fieldset);
    });
}

function checkLayers() {
    Object.keys(viz.layers).forEach(function (layer) {
        var check = document.getElementById("layer-" + layer), checked;
        if (check) {
            checked = check.checked;
        } else {
            checked = true;
        }
        document.getElementById(layer).style.display = checked ? "block" : "none";
    });
}

function getBehaviorTable() {
    var behaviorData = [],
        bTable = document.getElementById('behaviorTable');

    Array.from(bTable.options).forEach(function (b) {
        var strSit = b.textContent.slice(0, b.textContent.indexOf(":")).trim(),
            strRsp = b.textContent.slice(b.textContent.indexOf(":") + 1).trim(),
            bData = {},
            trueSit,
            falseSit = [],
            situation = {};

        // situation
        if (strSit !== "default") {
            if (strSit.indexOf("(") > -1) {
                falseSit = strSit.slice(strSit.indexOf("(") + 1, -1).split(", ");
                trueSit = strSit.slice(0, strSit.indexOf(" (")).split(", ");
            } else {
                trueSit = strSit.split(", ");
            }
            trueSit.forEach(function (d) {
                situation[d] = true;
            });
            falseSit.forEach(function (d) {
                situation[d] = false;
            });
        }
        bData.situation = situation;
        bData.response = JSON.parse(strRsp);
        behaviorData.push(bData);
    });
    return JSON.stringify(behaviorData);
}

function createBehaviorData() {
    // go through dialog and build the behavior
    var situations = document.querySelectorAll("#behaviorEdit > div:first-child > div"),
        situation = {},
        actionSelect = document.querySelector(".action-type"),
        actionParams,
        actionParam = {},
        response = [];

    Array.from(situations).forEach(function (s) {
        var radios = Array.from(s.getElementsByTagName("input")),
            detector = s.getAttribute("data-detector");

        radios.forEach(function (r) {
            if (r.checked && r.value !== "") {
                situation[detector] = !!+r.value;
            }
        });
    });

    response.push(actionSelect.value.slice(0, actionSelect.value.indexOf("-")));
    response.push(actionSelect.value.slice(actionSelect.value.indexOf("-") + 1));
    actionParams = Array.from(document.querySelectorAll("#action-param > label"));
    actionParams.forEach(function (ap) {
        var paramValue = ap.getElementsByTagName("select");
        if (paramValue.length === 0) {
            paramValue = ap.getElementsByTagName("input");
        }
        actionParam[ap.getAttribute("data-action-param")] = paramValue[0].value;
    });
    if (actionParams.length) {
        response.push(actionParam);
    }
    return {"situation": situation, "response": response};
}

function init() {
    disableControlButtons(true);

    // Wait to implement live behavior editing until later
    /*document.getElementById("newBehavior").onclick = function () {
        clearDetectors();
        editingBehavior = -1;
        // Implement own dialog
        document.getElementById("behaviorEdit").showModal();
    };
    document.getElementById("closeBehaviorEdit").onclick = function () {
        document.getElementById("behaviorEdit").close();
    };
    document.getElementById("saveBehavior").onclick = function () {
        socket.emit('btable', getBehaviorTable());
    };
    document.getElementById("saveBehaviorEdit").onclick = function () {
        var bTable = document.getElementById("behaviorTable"),
            option = document.createElement("option");

        if (editingBehavior === -1) {
            // add to list
            option.value = bTable.options.length;
            option.textContent = behaviorDisplay(createBehaviorData());
            option.ondblclick = editBehavior;
            bTable.appendChild(option);
        } else {
            // update list
            window.console.log(editingBehavior);
            bTable.options[editingBehavior].textContent = behaviorDisplay(createBehaviorData());
        }
    };*/

    socket = new WebSocket("ws://" + location.host);

    // Create canvas visualisation layers
    var vizualizer = document.getElementById('vizualize');
    Object.keys(viz.layers).forEach(function (v) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext("2d");

        canvas.id = v;
        canvas.width = viz.canvasWidth;
        canvas.height = viz.canvasHeight;
        viz.layers[v].canvas = canvas;
        vizualizer.appendChild(canvas);

        if (viz.layers[v].color && typeof viz.layers[v].color !== "function") {
            ctx.fillStyle = "rgba(" + viz.layers[v].color.join(", ") + ")";
        }
        viz.layers[v].ctx = ctx;
    });

    Object.keys(viz.layers).forEach(function (layer) {
        var layerCheck = document.getElementById("layer-" + layer);
        if (layerCheck) {
            layerCheck.onclick = checkLayers;
        }
    });
    checkLayers();

    socket.onopen = function(e) {
        console.log(e);
    };

    socket.onclose = function(e) {
        console.log(e);
    };

    socket.onmessage = function(e) {
        var dataObj;

        if (typeof e.data === "object") {
            dataObj = new FileReader();
            dataObj.onload = function(data) {
                paintRaw("luma", JSON.parse(this.result).data);
            };
            dataObj.readAsText(e.data);
        } else {
            dataObj = JSON.parse(e.data);
            if (dataObj.type === "actions") {
                actionData = dataObj.data;
                displayActions();
            }
            if (dataObj.type === "behaviors") {
                displayBehaviors(dataObj.data);
            }
            if (dataObj.type === "getSenseParams") {
                displayParams(dataObj.data, "sense");
            }
            if (dataObj.type === "getActionParams") {
                displayParams(dataObj.data, "action");
            }
            if (dataObj.type === "stateString") {
                senseStateReceived(dataObj.data);
            }
        }
    };

    /*
    socket.on("disconnect", function () {
        window.console.log('disconnected');
    });*/
}

init();
