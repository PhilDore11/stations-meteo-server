const db = require('./db');

const _ = require('lodash');

const getClientsQuery = `
  SELECT 
    clients.*,
    users.id as userId,
    users.username,
    users.password
  FROM 
    clients 
  LEFT JOIN
    userClients ON clients.id = userClients.clientId AND userId != 1
  LEFT JOIN
    users ON userClients.userId = users.id
  WHERE
    clients.id IN (?)
`;

module.exports = {
  post: (req, res, next) => {
    const { name } = req.body;

    db.connection.query('INSERT INTO clients (name) VALUES (?)', [name], (clientsErr, results) => {
      if (clientsErr) return next(clientsErr.sqlMessage);

      res.status(200).send(results);
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
    db.connection.query(getClientsQuery, [req.query.id], (err, results) => {
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
