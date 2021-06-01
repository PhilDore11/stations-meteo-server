const db = require("../utils/db");

const _ = require("lodash");

const loginQuery =
  "SELECT * FROM userClients JOIN users ON users.id = userClients.userId JOIN clients ON clients.id = userClients.clientId WHERE username=? AND password=MD5(?);";

module.exports = {
  login: async (req, res, next) => {
    try {
      const results = await db.connection.query(loginQuery, [
        req.body.username,
        req.body.password,
      ]);
      if (_.isEmpty(results)) return next("Utilisateur non Identifié.");

      const user = _.omit(results[0], "password", "clientId");
      user.clients = results.map((res) => ({
        id: res.clientId,
        name: res.name,
        email: res.email,
      }));
      return res.json(user);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
