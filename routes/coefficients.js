const db = require("../utils/db");

module.exports = {
  post: (req, res, next) => {
    const { stationId, coefficient } = req.body;

    db.connection.query(
      "INSERT INTO stationCoefficients (stationId, coefficient, dateModified) VALUES (?, ?, NOW())",
      [
        stationId,
        coefficient,
      ],
      (coefficientsErr, results) => {
        if (coefficientsErr) return next(coefficientsErr.sqlMessage);

        res.status(200).send(results);
      }
    );
  },
};
