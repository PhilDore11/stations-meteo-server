const db = require("../utils/db");

module.exports = {
  get: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      const results = await db.connection.query(
        `
      SELECT 
        LNDBStationMeta.stationID as id, 
        LNDBStationMeta.lnStationName as name,
        stations.stationId
      FROM LNDBStationMeta 
      LEFT JOIN stations ON LNDBStationMeta.stationID = stations.stationId 
      `,
        clientId
      );
      return res.json(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
