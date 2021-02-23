const db = require("../utils/db");

const _ = require("lodash");

const getAllClientsQuery = `
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
`;

const getClientsQuery = getAllClientsQuery.concat(`
  WHERE
    clients.id IN (?)
`);

const getStationsQuery = ` 
  SELECT * FROM stations WHERE  clientid = ?;`;

module.exports = {
  post: (req, res, next) => {
    const { name } = req.body;

    db.connection.query(
      "INSERT INTO clients (name) VALUES (?)",
      [name],
      (clientsErr, results) => {
        if (clientsErr) return next(clientsErr.sqlMessage);

        res.status(200).send(results);
      }
    );
  },
  put: (req, res, next) => {
    const { clientId } = req.params;
    const clientData = _.omit(req.body, "stations");
    db.connection.query(
      `UPDATE clients SET ? WHERE id=${clientId}`,
      clientData,
      (err) => {
        if (err) return next(err.sqlMessage);

        res.status(200).send({});
      }
    );
  },
  get: (req, res, next) => {
    const clientIds = req.query.id;
    if (clientIds && clientIds.length > 0) {
      db.connection.query(getClientsQuery, [req.query.id], (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      });
    } else {
      db.connection.query(getAllClientsQuery, null, (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      });
    }
  },
  getStations: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query(getStationsQuery, clientId, (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
  delete: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query("DELETE from clients WHERE id=?", clientId, (err) => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
};
