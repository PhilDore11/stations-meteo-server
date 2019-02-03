const moment = require('moment');

const db = require('./db');
const constants = require('./constants');

const getQuery = "SELECT stationData.* FROM stationData JOIN stations ON stationData.stationId = stations.id JOIN clients ON stations.clientId = clients.id WHERE clients.id = ? AND (stationData.date BETWEEN ? AND ?)";

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;
    const { start, end } = req.query;

    db.connection.query(getQuery, [parseInt(clientId), moment(start).format(constants.MYSQL_DATETIME_FORMAT), moment(end).format(constants.MYSQL_DATETIME_FORMAT)], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    })
  },
}
