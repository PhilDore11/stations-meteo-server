const express = require('express');
const router = express.Router();

const data = require('./data');

router.get('/data', data);

module.exports = router;
