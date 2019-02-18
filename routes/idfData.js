const db = require('./db');
const _ = require('lodash');

const stationDataUtils = require('../utils/stationData');

const getQuery = `
  SELECT 
    referenceStationData.* 
  FROM 
    referenceStationData 
  JOIN referenceStations 
    ON referenceStationData.stationId = referenceStations.id 
  JOIN stations 
    ON stations.referenceStationId = referenceStations.id 
  WHERE 
    stations.stationId = ?;
`;

const getStationQuery = `
  SELECT 
    MIN(stationData.date) as date, 
    SUM(stationData.intensity) / 0.1 * stations.coefficient as intensity 
  FROM 
    stationData
  JOIN stations
    ON stationData.stationId = stations.stationId
  WHERE 
    stationData.stationId = ? AND 
    (stationData.date BETWEEN ? AND ?)
  GROUP BY YEAR(date), MONTH(date), DAY(date), HOUR(date), MINUTE(date)
`;

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
  getStationData: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    db.connection.query(getStationQuery, [stationId, start, end], (err, results) => {
      if (err) return next(err.sqlMessage);

      let idfStationData = [];
      if (!_.isEmpty(results)) {
        idfStationData = [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(increment => ({
          increment,
          intensity: stationDataUtils.getMaxStationData(results, increment),
        }));
      }

      res.json(idfStationData);
    });
  },
};
