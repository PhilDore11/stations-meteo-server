const db = require("../utils/db");

module.exports = {
  post: async (req, res, next) => {
    const { stationId, coefficient } = req.body;

    try {
      const results = await db.connection.query(
        "INSERT INTO stationCoefficients (stationId, coefficient, dateModified) VALUES (?, ?, SUBTIME(NOW(),'05:00'))",
        [stationId, coefficient]
      );
      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
