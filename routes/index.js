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

const users = require('./users');
router.post('/users', users.post);
router.put('/users/:userId', users.put);
router.delete('/users/:userId', users.delete);

const userClients = require('./userClients');
router.get('/userClients/:clientId', userClients.get);
router.post('/userClients', userClients.post);
router.delete('/userClients', userClients.delete);

const alerts = require('./alerts');
router.get('/alerts/:clientId', alerts.get);
router.post('/alerts/:clientId', alerts.post);
router.delete('/alerts/:clientId', alerts.delete);

const stationData = require('./stationData');
router.get('/stationData/:stationId', stationData.get);
router.get('/stationData/:stationId/latest', stationData.getLatest);

const idfData = require('./idfData');
router.get('/idfData/:stationId', idfData.get);
router.get('/idfData/:stationId/stationData', idfData.getStationData);

const stations = require('./stations');
router.post('/stations', stations.post);
router.put('/stations/:stationId', stations.put);
router.delete('/stations/:stationId', stations.delete);

const referenceStations = require('./referenceStations');
router.get('/referenceStations', referenceStations.get);

const crons = require('./crons');
// crons.startInsertCron();
crons.startAlertsCron();

module.exports = router;
