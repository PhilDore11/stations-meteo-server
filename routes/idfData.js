const db = require('./db');

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

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
};
