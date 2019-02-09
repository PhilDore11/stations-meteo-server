const moment = require('moment');

const db = require('./db');
const constants = require('./constants');

const getQuery =
  'SELECT MIN(stationData.date) as date, SUM(stationData.intensity) as intensity FROM stationData JOIN stations ON stationData.stationId = stations.stationId JOIN clients ON stations.clientId = clients.id WHERE clients.id = ? AND (stationData.date BETWEEN ? AND ?)';

module.exports = {
  get: (req, res, next) => {
    const { clientId } = req.params;
    const { start, end, view } = req.query;

    let groupByClauses = [];
    if (view === 'day') {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)', 'HOUR(date)', 'MINUTE(date)'];
    } else if (view === 'week') {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)', 'HOUR(date)'];
    } else {
      groupByClauses = ['YEAR(date)', 'MONTH(date)', 'DAY(date)'];
    }

    db.connection.query(
      getQuery + ' GROUP BY ' + groupByClauses.join(', '),
      [
        parseInt(clientId),
        moment(start).format(constants.MYSQL_DATETIME_FORMAT),
        moment(end).format(constants.MYSQL_DATETIME_FORMAT),
      ],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.json(results);
      },
    );
  },
};
