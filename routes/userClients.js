const db = require("../utils/db");

module.exports = {
  get: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      const results = await db.connection.query(
        "SELECT userId, clientId FROM userClients JOIN users ON userClients.userId = users.id where clientId=? and users.admin=false;",
        [clientId]
      );

      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  post: async (req, res, next) => {
    const { userId, clientId } = req.body;

    try {
      const results = await db.connection.query(
        "INSERT INTO userClients (userId, clientId) VALUES (?, ?), (?, ?)",
        [userId, clientId, 1, clientId]
      );

      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  delete: async (req, res, next) => {
    const { userId, clientId } = req.params;

    try {
      const results = await db.connection.query(
        "DELETE from userClients WHERE userId=? AND clientId=?",
        [userId, clientId]
      );

      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
