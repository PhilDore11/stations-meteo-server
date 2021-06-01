const db = require("../utils/db");

const _ = require("lodash");

module.exports = {
  get: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      const results = await db.connection.query(
        "SELECT * FROM clientAlerts WHERE clientId=?",
        clientId
      );

      const alerts = results.map((res) => ({
        ...res,
        hasRain: res.hasRain === 1,
        hasSnow: res.hasSnow === 1,
        hasWind: res.hasWind === 1,
        hasHydro: res.hasHydro === 1,
      }));

      return res.json(alerts);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  post: async (req, res, next) => {
    const { clientId } = req.params;
    const { alerts } = req.body;

    const newAlerts = alerts.map((alert) => ({ ...alert, clientId }));

    try {
      await db.connection.query(
        "DELETE FROM clientAlerts WHERE clientId=?",
        clientId
      );

      for (let i = 0; i < newAlerts.length; i++) {
        db.connection.query(
          "INSERT INTO clientAlerts SET ?",
          newAlerts[i],
          (err, results) => {
            if (err) return next(err.sqlMessage);
          }
        );
      }

      return res.json({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  delete: async (req, res, next) => {
    const { clientId } = req.params;

    try {
      await db.connection.query(
        "DELETE FROM clientAlerts WHERE clientId=?",
        clientId
      );
      return res.json({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
