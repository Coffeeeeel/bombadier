/* jshint esversion: 6, node: true */

const moment = require("moment");
const {roundValue} = require("./utils");

// FIXME: module doe snot provide any documentation on 
// exception handling, so need to 'break' things and determine
// what exceptions we need to handle etc.
const netcdf4 = require("netcdf4");

// Assumes only 1 multidimensional variable and assumes
// other dimensions are time, lat and lon. 
function getPrimaryVariableName(ncObject) {
  var name;

  for (let v in ncObject.root.variables) {
    if (v !== "lat" && v !== "lon" && v !== "time") {
      name = v;
    }
  }
  return name;
}

// Base date used for offset in time dimension 
function getBaseDate(str) {
  var re = /(\d+-\d+-\d+) \d+:\d+:\d+$/;
  var dateStr = str.match(re)[1];

  return moment(dateStr);
}

// Gather relevant info about time dimension 
function getTimeDimension(ncObject) {
  var timeVar = ncObject.root.variables.time;
  var size = timeVar.dimensions[0].length;
  var baseDate = getBaseDate(timeVar.attributes.units.value);
  var values = timeVar.readSlice(0, size);
  var validTimes = [];

  // I hate Dates, Timezones and bloody daylight saving!
  // FIXME: BOM netcdf files lack consistent/clear timezone
  // information. Need to verify. 
  values.forEach(function (d) {
    validTimes.push(moment(baseDate).add(Math.floor(d), "days")
                    .add((d % 1) * 24, "hours"));
  });

  return {
    size,
    baseDate,
    values,
    validTimes
  };
}

// get relevant info on lat/lon dimensions 
function getDimensionData(ncObject, dim) {
  var dimVar = ncObject.root.variables[dim];
  var size = dimVar.dimensions[0].length;
  var values = dimVar.readSlice(0, size);

  return {
    size,
    values
  };
}

// get relavent info on primary variable of interest
// this could be pr, rsds, tasmax, tasmin, vprp (9am/3pm), 
// or wind_speed. 
// Don't want to use filename to determine primary variable
// as BOM can/does change filename format, so too brittle.
function getPrimaryVar(ncObject) {
  var name = getPrimaryVariableName(ncObject);
  var target = ncObject.root.variables[name];
  var units = target.attributes.units.value;
  var fillValue = target.attributes.missing_value.value;

  return {
    name,
    target,
    units,
    fillValue
  };
}

// need to round and put into a new array. Cannot just
// use map as it will create a new array of the same tyupe
// which won't fix our rouding issue
function getRoundedValues(data) {
  var newValues = [];

  for (let [idx, value] of data.values.entries()) {
    newValues[idx] = roundValue(2, value);
  }
  return newValues;
}

// setup a netcdf object. May want to open multiple objects
// at same time, so keep value scope local to each object instance
exports.netcdfInit = function(ncFile) {
  var fileName = ncFile;
  var nc = new netcdf4.File(ncFile, "r");
  var primary = getPrimaryVar(nc);
  var timeData = getTimeDimension(nc);
  var latitudeData = getDimensionData(nc, "lat");
  var longitudeData = getDimensionData(nc, "lon");

  function readLonDimension(timeIndex, latitudeIndex) {
    var row = primary.target.readSlice(timeIndex, 1, latitudeIndex, 1, 0, longitudeData.size);
    return row.map(function(v) {
      if (v === primary.fillValue) {
        return undefined; 
      }
      return v;
    });
  }

  return {
    metaInfo : function () {
      return {
        fileName : fileName,
        primaryVar :  primary.name,
        primaryUnits : primary.units,
        timeSize : timeData.size,
        baseDate : timeData.baseDate,
        latitudeSize : latitudeData.size,
        longitudeSize : longitudeData.size,
        fillValue : primary.fillValue
      };
    },
    readGrid : function (timeIndex) {
      var grid = [];

      for (let latitude = 0; latitude < latitudeData.size; latitude++) {
        grid[latitude] = readLonDimension(timeIndex, latitude);
      }
      return grid;
    },
    getLatitudes : function () {
      return getRoundedValues(latitudeData);
    },
    getLongitudes : function () {
      return getRoundedValues(longitudeData);
    },
    rawTimes : timeData.values,
    validTimes : timeData.validTimes,
    rawLatitudes : latitudeData.values,
    rawLongitudes : longitudeData.values,
    close : function () {
      nc.close(); 
    }
  };
};

