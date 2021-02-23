const db = require('../utils/db');

const _ = require('lodash');

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;

    db.connection.query('SELECT * FROM clientAlerts WHERE clientId=?', clientId, (err, results) => {
      if (err) return next(err.sqlMessage);

      const alerts = results.map(res => ({
        ...res,
        hasRain: res.hasRain === 1,
        hasSnow: res.hasSnow === 1,
        hasWind: res.hasWind === 1,
        hasHydro: res.hasHydro === 1,
      }));

      res.json(alerts);
    });
  },
  post: (req, res, next) => {
    const { clientId } = req.params;
    const { alerts } = req.body;

    const newAlerts = alerts.map(alert => ({ ...alert, clientId }));

    db.connection.query('DELETE FROM clientAlerts WHERE clientId=?', clientId, err => {
      if (err) return next(err.sqlMessage);

      for (let i = 0; i < newAlerts.length; i++) {
        db.connection.query('INSERT INTO clientAlerts SET ?', newAlerts[i], (err, results) => {
          if (err) return next(err.sqlMessage);
        });
      }

      res.json({});
    });
  },
  delete: (req, res, next) => {
    const { clientId } = req.params;

    db.connection.query('DELETE FROM clientAlerts WHERE clientId=?', clientId, err => {
      if (err) return next(err.sqlMessage);

      res.json({});
    });
  },
};
