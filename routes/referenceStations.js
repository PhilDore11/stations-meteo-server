const db = require("./db");

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query(
      "SELECT * FROM referenceStations",
      clientId,
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      }
    );
  },
};
