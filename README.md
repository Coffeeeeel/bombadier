# Bombadier - Process large NetCDF data files

A Node.js program to read large(ish) NetCDF data files and ingest the data into
a Postgres database. The data files contain weather prediction data from the
BOM. 

## Requirements

- Program must process at least 11 netcdf files per day for each of 6 weather
  prediction variables (rain fall, temperature max, temprature min, solar
  radiation, wind speed and humidity).
- Each data file contains 217 days of prediction. 
- Data broken up into 5km areas covering Australia (over 612,226 data points)
  per prediction variable per day i.e. each file contains around 138 million
  data points and there are 11 files per variable. 
- All data must be processed within 24 hours.


  
