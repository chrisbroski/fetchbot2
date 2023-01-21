function Mood(senses) {
    "use strict";

    var performParams = {};

    this.perform = {};

    performParams.setMood = [
        {
            description: 'type',
            options: [
                'searching', // default
                'relaxing',
                'chasing'
            ]
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

    // set mood (type, duration)
    // send to current_action
    this.perform.setMood = function setMood(params) {
        if (!params) {
            return performParams.setMood;
        }
        // motor(movement[params.type.replace(/-/, "")]);
        senses.currentAction("mood", "perform", params.type, {"duration": params.duration});
    };

    // clean up expired moods

    function init() {
        // if none, set to default
        senses.currentAction("mood", "perform", "chasing", {"duration": 300}); // change to searching
    }

    init();
}

module.exports = Mood;
