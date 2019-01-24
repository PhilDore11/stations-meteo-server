const db = require('./db');

module.exports = {
  get: (req, res, next) => {
    const {clientId} = req.params;
    db.connection.query(
      'SELECT * from stations WHERE clientId=?',
      [parseInt(clientId)],
      (err, results) => {
        if (err) return next(err);

        res.json(results);
      }
    )
  },
}
