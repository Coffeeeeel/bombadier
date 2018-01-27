/* jshint esversion: 6, node: true */

"use strict";

// Temporary solution. 
// Read awap info in from a json file. 
// replace with an API fetch later.

const awapJson = require("./awap-grid.json");

function initGrid(xSize, ySize) {
  var grid = new Array(xSize);

  for (let i = 0; i < grid.length; i++) {
    grid[i] = new Array(ySize);
  }

  return grid;
}

exports.awapInit = function (latitudeValues, longitudeValues) {
  var awapGrid = initGrid(latitudeValues.length, longitudeValues.length);

  for (let awapRec of awapJson) {
    let latIndex = latitudeValues.findIndex(e => e === awapRec.latitude);
    let lonIndex = longitudeValues.findIndex(e => e === awapRec.longitude);

    if (latIndex !== -1 && lonIndex !== -1) {
      awapGrid[latIndex][lonIndex] = awapRec.awap_id;
    } else {
      console.log("Bad awap Index: ", awapRec);
    }
  }
  return awapGrid;
};
