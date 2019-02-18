const moment = require('moment');

const db = require('./db');
const constants = require('./constants');

const getQuery = `
  SELECT 
    MIN(stationData.date) as date, 
    SUM(stationData.intensity) / 0.1 * stations.coefficient as intensity 
  FROM 
    stationData
  JOIN
    stations
  ON
    stationData.stationId = stations.stationId
  WHERE 
    stationData.stationId = ? AND 
    (stationData.date BETWEEN ? AND ?)
`;

const getLatestQuery = `
  SELECT
    stationData.battery,
    stationData.intensity / 0.1 * stations.coefficient as intensity
  FROM
    stationData
  JOIN
    stations
  ON
    stationData.stationId = stations.stationId
  WHERE 
    stationData.stationId = ?
  ORDER BY date DESC
  LIMIT 1;
`;

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end, view } = req.query;

    let groupByClauses = [];
    if (view === 'day') {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)', 'HOUR(date)', 'MINUTE(date)'];
    } else if (view === 'week') {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)', 'HOUR(date)'];
    } else {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)'];
    }

    const query = getQuery + ' GROUP BY ' + groupByClauses.join(', ');

    db.connection.query(
      query,
      [
        stationId,
        moment(start).format(constants.MYSQL_DATETIME_FORMAT),
        moment(end).format(constants.MYSQL_DATETIME_FORMAT),
      ],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      },
    );
  },
  getLatest: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getLatestQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results[0] || {});
    });
  },
};
