const util = require('util');

const cron = require('node-cron');
const moment = require('moment');
moment.locale('fr');
const nodemailer = require('nodemailer');

const _ = require('lodash');

const stationDataUtils = require('../utils/stationData');

const constants = require('./constants');
const db = require('./db');

db.connection.query = util.promisify(db.connection.query);

const getStationDataForAlertsQuery = `
  SELECT
    stationData.stationId,
    stationData.date,
    stationData.intensity / 0.1 * stations.coefficient as intensity
  FROM
    stationData
  JOIN
    stations
  ON
    stationData.stationId = stations.stationId
  WHERE
    stationData.date >= NOW() - INTERVAL 1 DAY
  ORDER BY date DESC;
`;

const getReferenceStationQuery = `
  SELECT 
    referenceStationData.* 
  FROM 
    referenceStationData 
  JOIN referenceStations 
    ON referenceStationData.stationId = referenceStations.id 
  JOIN stations 
    ON stations.referenceStationId = referenceStations.id 
  WHERE 
    stations.stationId = ?;
`;

const getStationClient = `
  SELECT
    clients.*
  FROM
    clients
  JOIN
    stations
  ON
    stations.clientId = clients.id
  WHERE
    stations.stationId = ?;
`;

let indicator = 1;

const startInsertCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    const newRow = {
      indicator: indicator++,
      stationId: 'TST1',
      date: moment().format(constants.MYSQL_DATETIME_FORMAT),
      battery: 12 - Math.random() * 5,
      intensity: Math.random() > 0.7 ? Math.random() * 2 : 0,
    };

    const insertResult = await db.connection.query('INSERT INTO stationData SET ?', newRow);
    console.log('Inserted new row', insertResult);
  });
};

const startAlertsCron = async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'philippe.dore.11@gmail.com',
      pass: 'chanelle1',
    },
  });

  cron.schedule('*/5 * * * *', async () => {
    console.log('Checking for alerts...');
    try {
      const stationDataResults = await db.connection.query(getStationDataForAlertsQuery);
      const groupedResults = _.groupBy(stationDataResults, res => res.stationId);

      _.each(groupedResults, async (stationData, stationId) => {
        const stationClientResults = await db.connection.query(getStationClient, [stationId]);
        const client = stationClientResults[0];
        const referenceStationResults = await db.connection.query(getReferenceStationQuery, [stationId]);
        [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(async increment => {
          const intensity = _.reduce(
            stationData,
            (sum, data, index) => (index < increment / 5 ? (sum += data.intensity) : sum),
            0,
          );
          let index = 0;
          let referenceData = referenceStationResults[index++];
          while (index <= referenceStationResults.length && intensity > referenceData[increment]) {
            const formattedInterval = moment.duration(increment, 'minutes').humanize();
            console.log(`Hit threshold for ${formattedInterval} - ${intensity}`);
            const mailOptions = {
              from: 'alertes@jfsa.test.com',
              to: client.email,
              subject: `${client.name} - Alerte de pluie - ${moment().format('lll')}`,
              text: `Une précipitation importante a été enregistrée lors des derniers ${formattedInterval}`,
            };

            await transporter.sendMail(mailOptions);

            referenceData = referenceStationResults[index++];
          }
        });
      });
    } catch (e) {
      console.error('Error', e);
    }
  });
};

module.exports = {
  startInsertCron,
  startAlertsCron,
};
