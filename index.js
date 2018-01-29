#!/usr/bin/env node

/* jshint esversion: 6, node: true */

"use strict";

function buildFilenames(shortDate, ensembleNumber) {
  var dataDirectory = "/Users/timcross/Documents/Projects/access-s/";
  var prefix = "daq5_";

  function makeFilename(weatherVar) {
    return dataDirectory + prefix + weatherVar + "_" + shortDate + "_e" + ensemble + ".nc";
  }
  
  return {
    pr : makeFilename("pr"),
    rsds : makeFilename("rsds"),
    tasmax : makeFilename("tasmax"),
    tasmin : makeFilename("tasmin"),
    vprp_09 : makeFilename("vprp_09"),
    vprp_15 : makeFilename("vprp_15"),
    wind_speed : makeFilename("wind_speed")
  };
}

const fs = require('fs');
const {awapInit} = require("./awap");
const bn = require('./bombadier-netcdf');

const strDate = process.argv[2];
const ensemble = process.argv[3];

var ncFiles = buildFilenames(strDate, ensemble);

console.log("Processing NC Files: ", ncFiles);

// load the data files
var pr = bn.netcdfInit(ncFiles.pr);
var rsds = bn.netcdfInit(ncFiles.rsds);
var tasmax = bn.netcdfInit(ncFiles.tasmax);
var tasmin = bn.netcdfInit(ncFiles.tasmin);
var vprp_09 = bn.netcdfInit(ncFiles.vprp_09);
var vprp_15 = bn.netcdfInit(ncFiles.vprp_15);
var wind_speed = bn.netcdfInit(ncFiles.wind_speed);

// get common data - any valid nc file from same ensemble will do
var validTime = pr.validTimes;
var latitudes = pr.getLatitudes();
var longitudes = pr.getLongitudes();

// build the AWAP grid
var awapGrid = awapInit(latitudes, longitudes);

// console.log(`AWAP GRID: ${awapGrid.length} x ${awapGrid[0].length}`);

// for now, just read grid for time index 0
var grids = {
  pr : pr.readGrid(0),
  rsds : rsds.readGrid(0),
  tasmax : tasmax.readGrid(0),
  tasmin : tasmin.readGrid(0),
  vprp_09 : vprp_09.readGrid(0),
  vprp_15 : vprp_15.readGrid(0),
  wind_speed : wind_speed.readGrid(0)
};


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
        pr: grids.pr[lat][lon],
        rsds : grids.rsds[lat][lon],
        tasmax : grids.tasmax[lat][lon],
        tasmin : grids.tasmin[lat][lon],
        vprp_09 : grids.vprp_09[lat][lon],
        vprp_15 : grids.vprp_15[lat][lon],
        wind_speed : grids.wind_speed[lat][lon]
      });
    }
  }
}
var nanResults = results.filter(r => isNaN(r.pr) || isNaN(r.tasmax) || isNaN(r.tasmin) ||
                                     isNaN(r.vprp_09) || isNaN(r.vprp_15) || isNaN(r.wind_speed));

// for (let r of nanResults) {
//   console.log(r);
// }

//console.log("Records with NaN Value: ", nanResults.length);

console.log("latitude, longitude, awapid");

for (let r of nanResults) {
  console.log(`${r.latitude}, ${r.longitude}, ${r.awapId}`);
}
// console.log("Number of results: ", results.length);

pr.close();
rsds.close();
tasmax.close();
tasmin.close();
vprp_09.close();
vprp_15.close();
