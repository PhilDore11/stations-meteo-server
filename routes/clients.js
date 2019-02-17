const db = require('./db');

const _ = require('lodash');

module.exports = {
  post: (req, res, next) => {
    db.connection.query('INSERT INTO clients SET ?', req.body, err => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
  put: (req, res, next) => {
    const { clientId } = req.params;
    const clientData = _.omit(req.body, 'stations');
    db.connection.query(`UPDATE clients SET ? WHERE id=${clientId}`, clientData, err => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
  get: (req, res, next) => {
    db.connection.query('SELECT * FROM clients WHERE clients.id IN (?)', [req.query.id], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
  getStations: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query('SELECT * FROM stations WHERE clientId=?', clientId, (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
  delete: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query('DELETE from clients WHERE id=?', clientId, err => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
};
