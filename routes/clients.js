const db = require('./db');

module.exports = {
  post: (req, res, next) => {
    db.connection.query(
      'INSERT INTO clients SET ?', 
      req.body, 
      (err) => {
        if (err) return next(err);

        res.send(200);
      }
    );
  },
  put: (req, res, next) => {
    db.connection.query(
      'UPDATE clients SET ? WHERE id=?', 
      [req.body, req.body.id], 
      (err) => {
        if (err) return next(err);

        res.send(200);
      }
    );
  },
  get: (req, res, next) => {
    db.connection.query(
      'SELECT * from clients', 
      (err, results) => {
        if (err) return next(err);

        res.json(results);
      }
    );
  },
  delete: (req, res, next) => {
    db.connection.query(
      'DELETE from clients WHERE id=?', 
      req.body.id, 
      (err) => {
        if (err) return next(err);

        res.send(200);
      }
    );
  },
}
