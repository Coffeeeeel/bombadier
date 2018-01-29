/* jshint esversion: 6, node: true */

const path = require("path");

exports.getFileComponents = function(fileName) {
    var re = /daq5_(\w+)_(\d+)_e(\d+)\.nc$/;
    var matches = fileName.match(re);

    console.log("Filename matches: ", matches);

    return {
        baseName : path.basename(fileName),
        directory : path.dirname(fileName),
        variable : matches[1],
        strDate : matches[2],
        ensemble : matches[3]
    };
};
