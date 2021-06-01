const db = require('../utils/db');

module.exports = {
  post: async (req, res, next) => {
    const { username, password } = req.body;

    try {
      const results = await db.connection.query(
        'INSERT INTO users (username, password) VALUES (?, MD5(?))',
        [username, password]);

      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  put: async (req, res, next) => {
    const { userId } = req.params;
    const { username, password } = req.body;

    try {
      await db.connection.query(`UPDATE users SET username=?, password=MD5(?) WHERE id=${userId}`, [username, password]);
      return res.status(200).send({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  delete: async (req, res, next) => {
    const { userId } = req.params;

    try {
      await db.connection.query('DELETE from users WHERE id=?', userId);
      return res.status(200).send({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
