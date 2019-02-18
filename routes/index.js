const express = require('express');
const router = express.Router();

const _ = require('lodash');

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
router.get('/stationData/:stationId/latest', stationData.getLatest);

const idfData = require('./idfData');
router.get('/idfData/:stationId', idfData.get);
router.get('/idfData/:stationId/stationData', idfData.getStationData);

// var cron = require('node-cron');
// var moment = require('moment');
// var constants = require('./constants');

// let indicator = 1;
// cron.schedule('*/5 * * * *', () => {
//   const newRow = {
//     indicator: indicator++,
//     stationId: 'TST1',
//     date: moment().format(constants.MYSQL_DATETIME_FORMAT),
//     battery: 12 - Math.random() * 10,
//     intensity: Math.random() * 5,
//   };

//   db.connection.query('INSERT INTO stationData SET ?', newRow);
// });

// const getStationDataForAlertsQuery = `
//   SELECT
//     stationData.stationId,
//     stationData.date,
//     stationData.intensity / 0.1 * stations.coefficient as intensity
//   FROM
//     stationData
//   JOIN
//     stations
//   ON
//     stationData.stationId = stations.stationId
//   WHERE
//     stationData.date >= NOW() - INTERVAL 1 DAY
//   ORDER BY date DESC;
// `;

// const getReferenceStationQuery = `
//   SELECT 
//     referenceStationData.* 
//   FROM 
//     referenceStationData 
//   JOIN referenceStations 
//     ON referenceStationData.stationId = referenceStations.id 
//   JOIN stations 
//     ON stations.referenceStationId = referenceStations.id 
//   WHERE 
//     stations.stationId = ?;`;

// const stationDataUtils = require('../utils/stationData');
// cron.schedule('*/5 * * * *', () => {
//   db.connection.query(getStationDataForAlertsQuery, (err, results) => {
//     if (err) console.err(err.sqlMessage);

//     const groupedResults = _.groupBy(results, res => res.stationId);

//     _.each(groupedResults, (stationData, stationId) => {
//       db.connection.query(getReferenceStationQuery, [stationId], (err, results) => {
//         if (err) console.err(err.sqlMessage);

//         [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(increment => {
//           const intensity = stationDataUtils.getMaxStationData(stationData, increment);
//           let index = 0;
//           let referenceData = results[index++];
//           while (index <= results.length && intensity > referenceData[increment]) {
//             console.log(`Hit ${referenceData.interval} year threshhold - ${increment}mins`);

//             referenceData = results[index++];
//           }
//         });
//       });
//     });
//   });
// });

module.exports = router;
