const db = require("./db");

module.exports = {
  post: (req, res, next) => {
    const { stationId, coefficient } = req.body;

    db.connection.query(
      "INSERT INTO stationCoefficients (stationId, coefficient, date) VALUES (?, ?, NOW())",
      [stationId, coefficient],
      (clientsErr, results) => {
        if (clientsErr) return next(clientsErr.sqlMessage);

        res.status(200).send(results);
      }
    );
  },

  get: (req, res, next) => {
    const { stationId } = req.params;
    const { end } = req.query;

    db.connection.query(
      `
        SELECT stationCoefficients.* 
        FROM   stationCoefficients 
               JOIN stations 
                 ON stationCoefficients.stationId = stations.id 
        WHERE  stations.stationId = ? 
               AND date < ? 
      `,
      [stationId, end],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      }
    );
  },
};
