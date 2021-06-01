const db = require("../utils/db");

module.exports = {
  get: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      const results = await db.connection.query(
        "SELECT * FROM referenceStations",
        clientId
      );
      return res.json(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
