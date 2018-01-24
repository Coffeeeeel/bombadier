const netcdf4 = require('netcdf4');

function getPrimaryVariable(ncObject) {
  var variables,
      primaryName;
    
  variables = Object.keys(ncObject.root.variables);
  primaryName = variables.reduce(function(acc, v) {
    if (v !== "lat" && v !== "lon" && v != "time") {
      return v;
    }
    return acc;
  });
  return [ncObject.root.variables[primaryName], primaryName];
}

exports.netcdfInit = function netcdfInit(ncFile) {
  const nc = new netcdf4.File(ncFile, 'r');
  var [targetVariable, varName] = getPrimaryVariable(nc);
  var tDimSize = nc.root.variables["time"].dimensions[0].length;
  var latDimSize = nc.root.variables["lat"].dimensions[0].length;
  var lonDimSize = nc.root.variables["lon"].dimensions[0].length;
  var missing = targetVariable.attributes.missing_value.value;

  return {
    metaInfo : function metaInfo() {
      return {
        filename : ncFile,
        mainVariable : targetVariable.attributes.long_name.value,
        shortName : varName,
        timeSize : tDimSize,
        latitudeSize : latDimSize,
        longitudeSize : lonDimSize,
        missingValues : missing
      };
    }
  };
}


