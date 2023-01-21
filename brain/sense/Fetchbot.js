global.tunable.senses.brightRed = {};
global.tunable.senses.brightRed.luma = 135;
global.tunable.senses.brightRed.chromaV = 185;
global.tunable.senses.edge = {};
global.tunable.senses.edge.diff = 50;
global.tunable.senses.center = {};
global.tunable.senses.center.width = 0.2;
global.tunable.senses.generalBrightness = {};
global.tunable.senses.generalBrightness.size = 16;

function Fetchbot() {
    'use strict';

    var dots = [];

    function testEdge(ii, visionWidth, imgPixelSize, luma) {
        var adjacent = [],
            val = luma[ii],
            diff = global.tunable.senses.edge.diff;

        if (ii > visionWidth) {
            adjacent.push(luma[ii - visionWidth]); // top
        }
        if (ii % visionWidth < visionWidth - 1) {
            adjacent.push(luma[ii + 1]); // right
        }
        if (ii < imgPixelSize - visionWidth) {
            adjacent.push(luma[ii + visionWidth]); // bottom
        }
        if (ii % visionWidth > 0) {
            adjacent.push(luma[ii - 1]); // left
        }

        // check adjacent for a significant increase in luma
        return adjacent.some(function (compare) {
            return (compare - val > diff);
        });
    }

    this.searchEdges = function searchEdges(luma, len, visionWidth) {
        var ii,
            contrast = [];

        for (ii = 0; ii < len; ii += 1) {
            if (testEdge(ii, visionWidth, len, luma)) {
                contrast.push(ii);
            }
        }

        return contrast;
    };

    function redColumns(visionWidth) {
        var centerWidth = global.tunable.senses.center.width,
            leftSide = (1.0 - centerWidth) / 2.0,
            rightSide = leftSide + centerWidth,
            redCount = [0, 0, 0];
        //go through dots. Add up each column
        // Return the column index with the greatest value
        dots.forEach(function (dot) {
            var colNum = ((dot - 1) % visionWidth) + 1;
            if (colNum < visionWidth * leftSide) {
                redCount[0] += 1;
            } else if (colNum > visionWidth * rightSide) {
                redCount[2] += 1;
            } else {
                redCount[1] += 1;
            }
        });
        return redCount;
    }
    this.redColumns = redColumns;

    function loc2x(i, visionWidth) {
        var row = Math.floor(i / visionWidth) + 1,
            col = i % visionWidth + 1,
            row2 = (row - 1) * 2 + 1,
            col2 = (col - 1) * 2 + 1;

        return [
            row2 * visionWidth * 2 + col2,
            row2 * visionWidth * 2 + col2 + 1,
            row2 * visionWidth * 2 + col2 + (visionWidth * 2),
            row2 * visionWidth * 2 + col2 + (visionWidth * 2) + 1
        ];
    }

    this.searchBrightRed = function searchBrightRed(v, visionWidth, l) {
        var ii,
            len = v.length,
            loc2,
            loc2val;

        dots.length = 0;

        function addLuma(a, b) {
            return a + l[b];
        }

        for (ii = 0; ii < len; ii += 1) {
            loc2 = loc2x(ii, visionWidth);

            loc2val = loc2.reduce(addLuma, 0);

            if (v[ii] > global.tunable.senses.brightRed.chromaV && loc2val / 4 > global.tunable.senses.brightRed.luma) {
                dots.push(ii);
            }
        }

        return dots;
    };

    function testGB(ii, visionWidth, imgPixelSize, luma) {
        var size = global.tunable.senses.generalBrightness.size;
        // var cols = Math.ceil(visionWidth / size);
        // var rows = Math.ceil(imgPixelSize / visionWidth / size);
        var col = (ii % Math.ceil(visionWidth / size));
        var row = Math.floor(ii / Math.ceil(visionWidth / size));

        var x = (row * size * visionWidth) + (col * size);
        var sum = 0;
        var jj;
        var kk;
        // var vals = [];
        for (jj = 0; jj < size; jj += 1) {
            for (kk = 0; kk < size; kk += 1) {
                sum += luma[(jj * visionWidth) + x + kk];
                // vals.push(luma[(jj * visionWidth) + x + kk]);
            }
        }

        return sum / (size * size);
    }

    this.generalBrightness = function generalBrightness(luma, len, visionWidth) {
        var ii;
        var blobs = [];
        const cols = Math.ceil(visionWidth / global.tunable.senses.generalBrightness.size);
        const rows = Math.ceil(len / visionWidth / global.tunable.senses.generalBrightness.size);
        const blocks = cols * rows;

        for (ii = 0; ii < blocks; ii += 1) {
            blobs.push(testGB(ii, visionWidth, len, luma));
        }
        return blobs;
    };

    // Find shapes and convexity
    // https://www.tutorialspoint.com/checking-for-convex-polygon-in-javascript
    // https://en.wikipedia.org/wiki/Delaunay_triangulation
}

module.exports = Fetchbot;
