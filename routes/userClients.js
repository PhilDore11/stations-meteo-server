const db = require('./db');

const _ = require('lodash');

module.exports = {
  post: (req, res, next) => {
    const { userId, clientId } = req.body;

    db.connection.query(
      'INSERT INTO userClients (userId, clientId) VALUES (?, ?), (?, ?)',
      [userId, clientId, 1, clientId],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.status(200).send(results);
      },
    );
  },
  delete: (req, res, next) => {
    const { userId, clientId } = req.params;
    db.connection.query('DELETE from userClients WHERE userId=? AND clientId=?', [userId, clientId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.status(200).send(results);
    });
  },
};
