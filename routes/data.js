var express = require('express');
var router = express.Router();

var precipitationData = require('./precipitationData.json');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json(precipitationData);
});

module.exports = router;
