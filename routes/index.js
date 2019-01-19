const express = require('express');
const router = express.Router();

const data = require('./data');
const clients = require('./clients');

router.get('/data', data);

clients.connect();
router.get('/clients', clients.get);
router.post('/clients', clients.post);
router.put('/clients', clients.put);
router.delete('/clients', clients.delete);

module.exports = router;
