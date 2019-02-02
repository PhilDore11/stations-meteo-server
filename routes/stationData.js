const moment = require('moment');
const db = require('./db');

const getQuery = "SELECT stationData.* FROM stationData JOIN stations ON stationData.stationId = stations.id JOIN clients ON stations.clientId = clients.id WHERE clients.id = ? AND (stationData.date BETWEEN ? AND ?)";

module.exports = {
  get: (req, res, next) => {
    const {clientId} = req.params;
    const { start, end } = req.query;

    db.connection.query(getQuery, [parseInt(clientId), moment(start).format('YYYY/MM/DD HH:mm:ss'), moment(end).format('YYYY/MM/DD HH:mm:ss')], (err, results) => {
      console.log("err", err);
      if (err) return next(err);

      res.json(results);
    })
  },
}
