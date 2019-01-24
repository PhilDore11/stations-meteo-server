const express = require('express');
const router = express.Router();

const data = require('./data');

router.get('/data', data);

const db = require('./db');
db.connect();

const clients = require('./clients');
router.get('/clients', clients.get);
router.post('/clients', clients.post);
router.put('/clients', clients.put);
router.delete('/clients', clients.delete);

const stations = require('./stations');
router.get('/stations/:clientId', stations.get);

module.exports = router;
