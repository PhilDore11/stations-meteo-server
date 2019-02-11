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

const getStationDataQuery = `
  SELECT * FROM idfStationData WHERE stationId = ? AND month = ?;
`

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
    const { month } = req.query;

    const query = db.connection.query(getStationDataQuery, [stationId, parseInt(month)+1], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });

    console.log(query.sql);
  },
};
