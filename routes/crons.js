const cron = require("node-cron");

// add timestamps in front of log messages
require("console-stamp")(console, {
  format: ":date(yyyy/mm/dd HH:MM:ss.l) :label",
});

const { some, forEach, isEmpty, isEqual } = require("lodash");

const db = require("../utils/db");

const { getStationTableName } = require("../utils/stationTableUtils");
const {
  getIncrementalData,
  getReferenceIncrementalData,
  findAlertThresholds,
  getMaxIntervalFromData,
} = require("../utils/alertUtils");
const { sendRainEmail } = require("../utils/emails/emailUtils.jsx");
const { logger } = require("../utils/logger");
const { convertToDateString } = require("../utils/dateUtils");

const getStationDataForAlertsQuery = (tableName) => `
  SELECT ${tableName}.TmStamp         AS stationDate, 
         Pluie_mm_Tot                 AS intensity
  FROM   ${tableName}
  WHERE  ${tableName}.TmStamp >= NOW() - INTERVAL 24 HOUR
  ORDER BY ${tableName}.TmStamp DESC
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

const getAllClients = `
  SELECT * FROM clients WHERE id = 12;
`;

const getClientStations = `
  SELECT stations.*, 
         coefficient
  FROM   stations
  LEFT JOIN (SELECT *
      FROM   stationCoefficients
      GROUP  BY stationId
      ORDER  BY dateModified DESC
      LIMIT  1) AS stationCoefficient
  ON stations.stationId = stationCoefficient.stationId
  WHERE  clientid = ?;`;

const getClientAlertConfig = `
  SELECT * FROM clientAlerts JOIN clients ON clientAlerts.clientId = clients.id WHERE clientId=?
`;

const getStationCoefficients = `
  SELECT * FROM stationCoefficients WHERE stationId = ? ORDER BY dateModified DESC;
`;

const getLastStationAlert = `
  SELECT * FROM stationAlerts WHERE stationId = ? AND TmStamp > NOW() - INTERVAL 6 HOUR ORDER BY TmStamp DESC LIMIT 1 
`;

const insertStationAlert = `
  INSERT INTO stationAlerts (stationId, TmStamp, \`5\`, \`10\`, \`15\`, \`30\`, \`60\`, \`120\`, \`360\`, \`720\`, \`1440\`) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const intervals = [5, 10, 15, 30, 60, 120, 360, 720, 1440];

const startAlertsCron = async () => {
  // cron.schedule("*/5 * * * *", async () => {
  try {
    console.debug(`ALERTS - starting...`);

    const clientsResults = await db.connection.query(getAllClients);
    forEach(clientsResults, async (client) => {
      console.debug(`ALERTS - ${client.name} - starting...`);
      const stationsResults = await db.connection.query(getClientStations, [
        client.id,
      ]);

      const clientRainAlerts = {};
      for (const station of stationsResults) {
        console.debug(
          `ALERTS - ${client.name} - ${station.name} - starting...`
        );
        const stationTableName = await getStationTableName(station.stationId);

        if (!stationTableName) {
          console.warn(
            `Could not find table for station (${station.id}: ${station.name})`
          );
          return;
        }

        // Station Coefficients
        let stationCoefficientsResults = await db.connection.query(
          getStationCoefficients,
          [station.stationId]
        );

        console.debug(
          `ALERTS - ${client.name} - ${station.name} - Found ${stationCoefficientsResults.length} coefficients ...`
        );

        // Station Data
        let stationDataResults = await db.connection.query(
          getStationDataForAlertsQuery(stationTableName),
          [station.stationId]
        );

        console.debug(
          `ALERTS - ${client.name} - ${station.name} - Found ${stationDataResults.length} results ...`
        );

        stationDataResults = stationDataResults.map((result) => ({
          ...result,
          coefficient: stationCoefficientsResults.find(
            (stationCoefficient) =>
              stationCoefficient.dateModified <= result.stationDate
          )?.coefficient,
        }));

        if (station.hasRain) {
          clientRainAlerts[station.name] = {
            id: station.id,
            stationDataResults,
            ...(await checkRainAlerts(stationDataResults, station)),
          };

          console.debug(
            `ALERTS - ${client.name} - ${
              station.name
            } - Rain alerts ${JSON.stringify(
              clientRainAlerts[station.name].alertThresholds,
              null,
              2
            )} ...`
          );
        }
      }

      const hasRainAlerts = some(
        clientRainAlerts,
        (clientRainAlert) => !isEmpty(clientRainAlert.alertThresholds)
      );

      if (hasRainAlerts) {
        console.debug(`ALERTS - ${client.name} - Has rain alerts ...`);

        let hasNewRainAlerts = false;
        let lastTimeEntry;

        const clientRainAlertKeys = Object.keys(clientRainAlerts);

        for (const clientRainAlertKey of clientRainAlertKeys) {
          console.debug(
            `ALERTS - ${client.name} - Checking ${clientRainAlertKey} ...`
          );
          const clientRainAlert = clientRainAlerts[clientRainAlertKey];

          lastTimeEntry = clientRainAlert.stationDataResults[0]?.stationDate;

          const getPeriod = (alertThreshold) => {
            return alertThreshold
              ? (alertThreshold?.data / alertThreshold?.threshold) *
                  alertThreshold?.interval
              : 0;
          };

          const alertRowMaxIntervals = intervals.map(
            (increment) =>
              (clientRainAlert.alertThresholds[increment] &&
                clientRainAlert.alertThresholds[increment].interval) ||
              0
          );

          console.debug(
            `ALERTS - ${client.name} - New Alert Values - ${alertRowMaxIntervals}`
          );

          // Retrieve latest alert
          const lastAlertRow = await db.connection.query(getLastStationAlert, [
            clientRainAlert.id,
          ]);
          const lastAlertRowValues = intervals.map(
            (increment) =>
              (lastAlertRow[increment] && lastAlertRow[increment].data) || 0
          );
          console.debug(
            `ALERTS - ${client.name} - Latest Alert - ${JSON.stringify(
              lastAlertRow,
              null,
              2
            )}`
          );

          if (
            shouldSendNewRainAlert(
              clientRainAlert.referenceData,
              alertRowMaxIntervals,
              lastAlertRowValues
            )
          ) {
            console.debug(`ALERTS - ${client.name} - New Alert ...`);
            hasNewRainAlerts = true;

            const alertRowValues = intervals.map(
              (increment) =>
                (clientRainAlert.alertThresholds[increment] &&
                  clientRainAlert.alertThresholds[increment].data) ||
                0
            );

            // Add Entry to Alerts Table
            await db.connection.query(insertStationAlert, [
              clientRainAlert.id,
              lastTimeEntry,
              ...alertRowValues,
            ]);
          } else {
            console.debug(`ALERTS - ${client.name} - Found Existing Alert ...`);
          }
        }

        if (hasNewRainAlerts) {
          console.debug(`ALERTS - ${client.name} - Sending new alert...`);

          // Client Alert Config
          const clientAlertConfig = await db.connection.query(
            getClientAlertConfig,
            [client.id]
          );

          await sendRainEmail(
            client,
            clientAlertConfig,
            clientRainAlerts,
            lastTimeEntry
          );
        } else {
          console.debug(
            `ALERTS - ${client.name} - Found previously sent alert...`
          );
        }
      }
    });
  } catch (e) {
    console.error("Error starting alerts", e);
  }
  // });
};

const checkRainAlerts = async (stationDataResults, station) => {
  try {
    const incrementalData = getIncrementalData(stationDataResults);

    // Reference Data
    const referenceDataResults = await db.connection.query(
      getReferenceStationQuery,
      [station.stationId]
    );
    const referenceStationId = referenceDataResults[0]?.stationId;
    const referenceData = getReferenceIncrementalData(referenceDataResults);

    // IDF constants
    const averagesResults = await db.connection.query(
      `SELECT * FROM idfAverages WHERE stationId = ? ORDER BY increment`,
      [referenceStationId]
    );
    const averages = averagesResults.map((result) => result.value);

    const standardDeviationsResults = await db.connection.query(
      `SELECT * FROM idfStandardDeviations WHERE stationId = ? ORDER BY increment`,
      [referenceStationId]
    );
    const standardDeviations = standardDeviationsResults.map(
      (result) => result.value
    );

    const alertThresholds = findAlertThresholds(incrementalData, referenceData);

    return { averages, standardDeviations, referenceData, alertThresholds };
  } catch (e) {
    console.error("Error", e);
  }
};

const shouldSendNewRainAlert = (
  referenceData,
  newAlertMaxIntervals,
  latestAlertValues
) => {
  const latestAlertMaxIntervals = latestAlertValues.map((value, index) =>
    getMaxIntervalFromData(value, referenceData[intervals[index]])
  );

  return !isEqual(newAlertMaxIntervals, latestAlertMaxIntervals);
};

module.exports = {
  startAlertsCron,
};
