const _ = require('lodash');

const db = require('./db');

const getQuery =
  'SELECT referenceStationData.* FROM referenceStationData JOIN referenceStations ON referenceStationData.stationId = referenceStations.id JOIN stations ON stations.referenceStationId = referenceStations.id WHERE stations.clientId = ?;';

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;

    db.connection.query(getQuery, [parseInt(clientId)], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
};
