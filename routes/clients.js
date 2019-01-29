const db = require('./db');

const _ = require('lodash');

const clientGetQuery = "SELECT clients.id AS clientId, clients.name AS clientName, clients.email AS email, stations.id as stationId, stations.latitude AS latitude, stations.longitude AS longitude, stations.ipAddress AS ipAddress, stations.deviceType AS deviceType, stations.name AS stationName FROM clients JOIN stations ON stations.clientId = clients.id;"

module.exports = {
  post: (req, res, next) => {
    db.connection.query('INSERT INTO clients SET ?', req.body, (err) => {
      if (err) return next(err);

      res.send(200);
    });
  },
  put: (req, res, next) => {
    db.connection.query('UPDATE clients SET ? WHERE id=?', [req.body, req.body.id], (err) => {
      if (err) return next(err);

      res.send(200);
    });
  },
  get: (req, res, next) => {
    db.connection.query(clientGetQuery, (err, results) => {
      if (err) return next(err);

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
  delete: (req, res, next) => {
    db.connection.query( 'DELETE from clients WHERE id=?', req.body.id, (err) => {
      if (err) return next(err);

      res.send(200);
    });
  },
}
