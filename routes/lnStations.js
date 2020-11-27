const db = require("./db");

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query(
      `
      SELECT 
        LNDBStationMeta.stationID as id, 
        LNDBStationMeta.lnStationName as name,
        stations.stationId
      FROM LNDBStationMeta 
      LEFT JOIN stations ON LNDBStationMeta.stationID = stations.stationId 
      `,
      clientId,
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      }
    );
  },
};
