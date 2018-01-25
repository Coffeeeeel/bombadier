const netcdf4 = require('netcdf4');

function getPrimaryVariableName(ncObject) {
  var varName;
  
  for (let v in ncObject.root.variables) {
    if (v !== "lat" && v !== "lon" && v !== "time") {
      varName = v;
    }
  }
  return varName;
}

function getBaseDate(str) {
  var re = /(\d+-\d+-\d+ \d+:\d+:\d+)$/;
  var dateStr = str.match(re)[0] + 'Z';

  return new Date(dateStr);
}

exports.netcdfInit = function netcdfInit(ncFile) {
  var fileName = ncFile;
  var nc = new netcdf4.File(ncFile, 'r');
  var varName = getPrimaryVariableName(nc);
  var targetVariable = nc.root.variables[varName];
  var units = targetVariable.attributes.units.value;
  var timeSize = nc.root.variables["time"].dimensions[0].length;
  var baseDate = getBaseDate(nc.root.variables["time"].attributes.units.value);
  var latitudeSize = nc.root.variables["lat"].dimensions[0].length;
  var longitudeSize = nc.root.variables["lon"].dimensions[0].length;
  var fillValue = targetVariable.attributes.missing_value.value;

  
  function readLonDimension(timeIndex, latitudeIndex) {
    var row = targetVariable.readSlice(timeIndex, 1, latitudeIndex, 1, 0, longitudeSize);
    return row.map(function(v) {
      if (v === fillValue) {
        return undefined; 
      }
      return v;
    });
  }

  return {
    metaInfo : function metaInfo() {
      return {
        fileName : fileName,
        varName : varName,
        units : units,
        timeSize : timeSize,
        baseDate : baseDate,
        latitudeSize : latitudeSize,
        longitudeSize : longitudeSize,
        fillValue : fillValue
      };
    },
    readGrid : function readGrid(timeIndex) {
      var grid = [];

      for (let latitude = 0; latitude < latitudeSize; latitude++) {
        grid[latitude] = readLonDimension(timeIndex, latitude);
      }
      return grid;
    },
    close : function () {
      nc.close(); 
    }
  };
}



