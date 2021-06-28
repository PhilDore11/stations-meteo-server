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
  SELECT  stations.*, 
          coefficient
  FROM    stations
          LEFT JOIN (SELECT *
              FROM   stationCoefficients GROUP BY stationId) AS stationCoefficient
            ON stations.stationId = stationCoefficient.stationId
  WHERE  clientid = ?
  ORDER BY dateModified DESC`;

module.exports = {
  post: async (req, res, next) => {
    const { name } = req.body;

    try {
      const results = db.connection.query(
        "INSERT INTO clients (name) VALUES (?)",
        [name]
      );
      return res.status(200).send(results);
    } catch (err) {
      return next(clientsErr.sqlMessage);
    }
  },

  put: async (req, res, next) => {
    const { clientId } = req.params;
    const clientData = _.omit(req.body, "stations");
    try {
      db.connection.query(
        `UPDATE clients SET ? WHERE id=${clientId}`,
        clientData
      );
      return res.status(200).send({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  get: async (req, res, next) => {
    const clientIds = req.query.id;
    try {
      const results =
        clientIds && clientIds.length > 0
          ? await db.connection.query(getClientsQuery, [req.query.id])
          : await db.connection.query(getAllClientsQuery);
      return res.json(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  getStations: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      const results = await db.connection.query(getStationsQuery, clientId);
      return res.json(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  delete: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      await db.connection.query("DELETE from clients WHERE id=?", clientId);
      return res.status(200).send({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
