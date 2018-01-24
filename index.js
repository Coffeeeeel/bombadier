#!/usr/bin/env node
/* jshint esversion:/* jshint esver 6, node: true */
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

var inFile = process.argv[2];

if (! inFile) {
  usage('No input file specified');
}

console.log(`Processing nc file ${inFile}`);

var bn = require('./bombadier-netcdf');

var nc = bn.netcdfInit(inFile);

console.log(nc.metaInfo());

