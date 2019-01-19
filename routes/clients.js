const mysql = require('mysql');

var connection = mysql.createConnection({
  host : 'stations-meteo.c7abk9qcbiox.ca-central-1.rds.amazonaws.com',
  port: 3306,
  user : 'admin',
  password : 'chanelle1',
  database : 'stationsMeteoDB'
});

module.exports = {
    connect: () => connection.connect(),
    disconnect: () => connection.end(),
    post: (req, res, next) => {
      connection.query('INSERT INTO clients SET ?', req.body, (err, results, fields) => {
        if (err) return next(err);

        res.send(200);
      });
    },
    put: (req, res, next) => {
      connection.query('UPDATE clients SET ? WHERE id=?', [req.body, req.body.id], (err, results, fields) => {
        if (err) return next(err);

        res.send(200);
      });
    },
    get: (req, res, next) => {
      connection.query('SELECT * from clients', (err, results, fields) => {
        if (err) return next(err);

        res.json(results);
      });
    },
    delete: (req, res, next) => {
      connection.query('DELETE from clients WHERE id=?', req.body.id, (err, results, fields) => {
        if (err) return next(err);

        res.send(200);
      });
    },
  }
