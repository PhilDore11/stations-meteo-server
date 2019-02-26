const db = require('./db');

const _ = require('lodash');

module.exports = {
  post: (req, res, next) => {
    const { username, password } = req.body;

    db.connection.query(
      'INSERT INTO users (username, password) VALUES (?, MD5(?))',
      [username, password],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.status(200).send(results);
      },
    );
  },
  put: (req, res, next) => {
    const { userId } = req.params;
    const { username, password } = req.body;
    db.connection.query(`UPDATE users SET username=?, password=MD5(?) WHERE id=${userId}`, [username, password], err => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
  delete: (req, res, next) => {
    const { userId } = req.params;
    db.connection.query('DELETE from users WHERE id=?', userId, err => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
};
