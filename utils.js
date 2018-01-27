/* jshint esversion: 6, node: true */

exports.roundValue = function (precision, v) {
  var factor = Math.pow(10, precision);

  return Math.round(v * factor) / factor;
};
