const express = require('express');
const router = express.Router();

const data = require('./data');

const mysql = require('mysql');

var connection = mysql.createConnection({
  host : 'stations-meteo.c7abk9qcbiox.ca-central-1.rds.amazonaws.com',
  port: 3306,
  user : 'admin',
  password : 'chanelle1',
  database : 'stationsMeteoDB'
});

router.get('/data', data);

router.get('/clients', (req, res, next) => {
  connection.connect();
  
  connection.query('SELECT * from clients', (err, results, fields) => {
    console.log('err', err);
    console.log('results', results);
    if (err) return next(err);
    
    connection.end();
    
    res.json(results);
  });
});

module.exports = router;
