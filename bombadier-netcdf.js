/* jshint esversion: 6, node: true */

const moment = require("moment");
const netcdf4 = require("netcdf4");

function getPrimaryVariableName(ncObject) {
  var name;

  for (let v in ncObject.root.variables) {
    if (v !== "lat" && v !== "lon" && v !== "time") {
      name = v;
    }
  }
  return name;
}

function getBaseDate(str) {
  var re = /(\d+-\d+-\d+) \d+:\d+:\d+$/;
  var dateStr = str.match(re)[1];

  return moment(dateStr);
}

function getTimeDimension(ncObject) {
  var timeVar = ncObject.root.variables.time;
  var size = timeVar.dimensions[0].length;
  var baseDate = getBaseDate(timeVar.attributes.units.value);
  var values = timeVar.readSlice(0, size);
  var validTimes = [];

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

function getDimensionData(ncObject, dim) {
  var dimVar = ncObject.root.variables[dim];
  var size = dimVar.dimensions[0].length;
  var values = dimVar.readSlice(0, size);

  return {
    size,
    values
  };
}

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

exports.netcdfInit = function netcdfInit(ncFile) {
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
    metaInfo : function metaInfo() {
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
    readGrid : function readGrid(timeIndex) {
      var grid = [];

      for (let latitude = 0; latitude < latitudeData.size; latitude++) {
        grid[latitude] = readLonDimension(timeIndex, latitude);
      }
      return grid;
    },
    rawTimes : timeData.values,
    validTimes : timeData.validTimes,
    latitudes : latitudeData.values,
    longitudes : longitudeData.values,
    close : function () {
      nc.close(); 
    }
  };
};

