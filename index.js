#!/usr/bin/env node
/* jshint esversion: 6, node: true */

"use strict";

function usage(errMsg) {
  console.log(`
${errMsg}

${process.argv[1]} <file>

where <file> is the path to an NetCDF input file

`);
  process.exit(1);
}

const fs = require('fs');
const {awapInit} = require("./awap");

var inFile = process.argv[2];

if (! inFile) {
  usage('No input file specified');
}

console.log(`Processing nc file ${inFile}`);

var bn = require('./bombadier-netcdf');

var nc = bn.netcdfInit(inFile);
var validTime = nc.validTimes;
var latitudes = nc.getLatitudes();
var longitudes = nc.getLongitudes();
var awapGrid = awapInit(latitudes, longitudes);

console.log(nc.metaInfo());

console.log(`AWAP GRID: ${awapGrid.length} x ${awapGrid[0].length}`);

// for (let lat = 0; lat < awapGrid.length; lat++) {
//   for (let lon = 0; lon < awapGrid[lat].length; lon++) {
//     if (awapGrid[lat][lon] !== undefined) {
//       console.log(`Lat: ${lat} Lon ${lon} AWAP: ${awapGrid[lat][lon]}`);
//     }
//   }
// }

var grid = nc.readGrid(0);

console.log("Grid Size: " + grid.length + " by " + grid[0].length);

var results = [];

for (let lat = 0; lat < awapGrid.length; lat++) {
  for (let lon = 0; lon < awapGrid[lat].length; lon++) {
    let awapId = awapGrid[lat][lon];
    if (awapId !== undefined) {
      results.push({
        latIdx : lat,
        lonIdx : lon,
        latitude : latitudes[lat],
        longitude : longitudes[lon],
        awapId : awapId,
        pr : grid[lat][lon]
      });
    }
  }
}

for (let r of results) {
  console.log(r);
}

console.log("Number of results: ", results.length);

nc.close();
