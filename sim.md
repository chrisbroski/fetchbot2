Simulation Notes
================

Mark off a grid X by X. Take a photo in 8 directions in each spot. Maybe start with 3 x 3 os it can start in the middle.

Hex grid would be more realistic, plus only need 6 pics per spot, not 8. Let's use an offset grid coordinate system, flat-topped, odd-q. https://www.redblobgames.com/grids/hexagons/

Initial position. (1, 1) and orientation (0 degrees maybe). Each turn is 60 degrees, sharp turn 120. Let's make it toroidal (no border stops.) let's make orientation equal to array ordinal: 0: 0, 1: 60, 2: 120, 3: 180, 4: 240, 5: 300.

    {
        intitial_position: [1, 1, 0],
        wrap_around: true;
        map: [
            [
                ["pic00-up.raw", "pic00-r1.raw", "pic00-r2.raw", "pic00-down.raw", "pic00-l2.raw", "pic00-l1.raw"],
                ["pic01-up.raw", "pic01-r1.raw", "pic01-r2.raw", "pic01-down.raw", "pic01-l2.raw", "pic01-l1.raw"],
                ["pic02-up.raw", "pic02-r1.raw", "pic02-r2.raw", "pic02-down.raw", "pic02-l2.raw", "pic02-l1.raw"]
            ],
            [
                ["pic10-up.raw", "pic10-r1.raw", "pic10-r2.raw", "pic10-down.raw", "pic10-l2.raw", "pic10-l1.raw"],
                ["pic11-up.raw", "pic11-r1.raw", "pic11-r2.raw", "pic11-down.raw", "pic11-l2.raw", "pic11-l1.raw"],
                ["pic12-up.raw", "pic12-r1.raw", "pic12-r2.raw", "pic12-down.raw", "pic12-l2.raw", "pic12-l1.raw"]
            ],
            [
                ["pic20-up.raw", "pic20-r1.raw", "pic20-r2.raw", "pic20-down.raw", "pic20-l2.raw", "pic00-l1.raw"],
                ["pic21-up.raw", "pic21-r1.raw", "pic21-r2.raw", "pic21-down.raw", "pic21-l2.raw", "pic21-l1.raw"],
                ["pic22-up.raw", "pic22-r1.raw", "pic22-r2.raw", "pic22-down.raw", "pic22-l2.raw", "pic22-l1.raw"]
            ]
        ]
    }

A simulation should include a map: the data structure (above) and the associated image files. Maybe in a "map" directory?

## Stuck Detection

Stuck sensors: https://snikolov.wordpress.com/2011/02/27/going-nowhere-fast-how-to-tell-if-your-robot-is-stuck-and-what-to-do-about-it/

What about accelerometers?
