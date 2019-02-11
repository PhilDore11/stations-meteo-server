const express = require('express');
const router = express.Router();

const data = require('./data');

router.get('/data', data);

const db = require('./db');
db.connect();

const auth = require('./auth');
router.post('/login', auth.login);

const clients = require('./clients');
router.get('/clients', clients.get);
router.post('/clients', clients.post);
router.put('/clients/:clientId', clients.put);
router.delete('/clients/:clientId', clients.delete);
router.get('/clients/:clientId/stations', clients.getStations);

const stationData = require('./stationData');
router.get('/stationData/:stationId', stationData.get);

const idfData = require('./idfData');
router.get('/idfData/:stationId', idfData.get);
router.get('/idfData/:stationId/stationdata', idfData.getStationData);

module.exports = router;
