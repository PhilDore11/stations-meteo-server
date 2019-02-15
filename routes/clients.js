const db = require('./db');

const _ = require('lodash');

const clientGetQuery = "SELECT *, stations.name as stationName FROM clients JOIN stations ON stations.clientId = clients.id WHERE clients.id IN (?);"

module.exports = {
  post: (req, res, next) => {
    db.connection.query('INSERT INTO clients SET ?', req.body, (err) => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
  put: (req, res, next) => {
    const { clientId } = req.params;
    const clientData = _.omit(req.body, 'stations');
    db.connection.query(`UPDATE clients SET ? WHERE id=${clientId}`, clientData, (err) => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
  get: (req, res, next) => {
    db.connection.query(clientGetQuery, [req.query.id], (err, results) => {
      if (err) return next(err.sqlMessage);

      let clientResults = []
      _.each(results, (result) => {
        const clientResult = clientResults.find((item) => item.id === result.clientId);

        const clientStation = {
          id: result.stationId,
          name: result.stationName,
          latitude: result.latitude,
          longitude: result.longitude,
          ipAddress: result.ipAddress,
          deviceType: result.deviceType,
          hasRain: result.hasRain,
          hasSnow: result.hasSnow,
          hasWind: result.hasWind,
          hasHydro: result.hasHydro,
        };

        if (clientResult) {
          clientResult.stations.push(clientStation);
        } else {
          clientResults.push({
            id: result.clientId,
            name: result.clientName,
            email: result.email,
            stations: [clientStation]
          })
        }
      })

      res.json(clientResults);
    });
  },
  getStations: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query( 'SELECT * FROM stations WHERE clientId=?', clientId, (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },
  delete: (req, res, next) => {
    const { clientId } = req.params;
    db.connection.query( 'DELETE from clients WHERE id=?', clientId, (err) => {
      if (err) return next(err.sqlMessage);

      res.status(200).send({});
    });
  },
}
