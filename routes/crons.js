const cron = require("node-cron");

const { some, forEach, isEmpty } = require("lodash");

const db = require("../utils/db");

const { getStationTableName } = require("../utils/stationTableUtils");
const {
  getIncrementalData,
  getReferenceIncrementalData,
  findAlertThresholds,
} = require("../utils/alertUtils");
const { sendRainEmail } = require("../utils/emails/emailUtils.jsx");
const { logger } = require("../utils/logger");
const { convertToDateString } = require("../utils/dateUtils");

const getStationDataForAlertsQuery = (tableName) => `
  SELECT ${tableName}.TmStamp         AS stationDate, 
         Pluie_mm_Tot                 AS intensity, 
         Pluie_mm_Validee             AS adjustedIntensity, 
         Coefficient                  AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON stationId = ? AND ${tableName}.RecNum = stationData.RecNum AND ${tableName}.TmStamp = stationData.TmStamp 
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
  SELECT * FROM clients WHERE id=4;
`;

const getClientStations = `
  SELECT * FROM stations WHERE stations.clientId = ?
`;

const getClientAlertConfig = `
  SELECT * FROM clientAlerts JOIN clients ON clientAlerts.clientId = clients.id WHERE clientId=?
`;

const getStationAlert = `
  SELECT * FROM stationAlerts WHERE stationId = ? AND 
  (TmStamp = ? OR (
    \`5\` = ? AND \`10\` = ? AND \`15\` = ? AND \`30\` = ? AND \`60\` = ? AND \`120\` = ? AND \`360\` = ? AND \`720\` = ? AND \`1440\` = ?
  ))
`;

const insertStationAlert = `
  INSERT INTO stationAlerts (stationId, TmStamp, \`5\`, \`10\`, \`15\`, \`30\`, \`60\`, \`120\`, \`360\`, \`720\`, \`1440\`) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const startAlertsCron = async () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const clientsResults = await db.connection.query(getAllClients);
      forEach(clientsResults, async (client) => {
        const stationsResults = await db.connection.query(getClientStations, [
          client.id,
        ]);

        const clientRainAlerts = {};
        for (const station of stationsResults) {
          const stationTableName = await getStationTableName(station.stationId);

          if (!stationTableName) return;

          // Station Data
          const stationDataResults = await db.connection.query(
            getStationDataForAlertsQuery(stationTableName),
            [station.stationId]
          );

          if (station.hasRain) {
            clientRainAlerts[station.name] = {
              id: station.id,
              stationDataResults,
              ...(await checkRainAlerts(stationDataResults, station)),
            };
          }
        }

        const hasRainAlerts = some(
          clientRainAlerts,
          (clientRainAlert) => !isEmpty(clientRainAlert.alertThresholds)
        );

        if (true || hasRainAlerts) {
          let hasNewRainAlerts = false;
          let lastTimeEntry;

          const clientRainAlertKeys = Object.keys(clientRainAlerts);

          for (const clientRainAlertKey of clientRainAlertKeys) {
            const clientRainAlert = clientRainAlerts[clientRainAlertKey];

            lastTimeEntry = clientRainAlert.stationDataResults[0]?.stationDate;

            const alertRowValues = [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(
              (increment) =>
                (clientRainAlert.alertThresholds[increment] &&
                  clientRainAlert.alertThresholds[increment].data) ||
                0
            );

            // Retrieve Existing Alert
            const existingAlert = await db.connection.query(getStationAlert, [
              clientRainAlert.id,
              lastTimeEntry,
              ...alertRowValues,
            ]);

            if (isEmpty(existingAlert)) {
              hasNewRainAlerts = true;
              // Add Entry to Alerts Table
              await db.connection.query(insertStationAlert, [
                clientRainAlert.id,
                lastTimeEntry,
                ...alertRowValues,
              ]);
            }
          }

          if (hasNewRainAlerts) {
            console.log(`Sending new alert for client ${client.name}...`);

            // Client Alert Config
            const clientAlertConfig = await db.connection.query(
              getClientAlertConfig,
              [client.id]
            );

            await sendRainEmail(
              clientAlertConfig,
              clientRainAlerts,
              lastTimeEntry
            );
          } else {
            console.log(`Alert already sent for client ${client.name}...`);
          }
        }
      });
    } catch (e) {
      console.error("Error starting alerts", e);
    }
  });
};

const checkRainAlerts = async (stationDataResults, station) => {
  console.log(`Checking for rain alerts for station ${station.name}...`);
  try {
    const incrementalData = getIncrementalData(stationDataResults);

    // Reference Data
    const referenceDataResults = await db.connection.query(
      getReferenceStationQuery,
      [station.stationId]
    );
    const referenceData = getReferenceIncrementalData(referenceDataResults);

    const alertThresholds = findAlertThresholds(incrementalData, referenceData);

    return { incrementalData, alertThresholds };
  } catch (e) {
    console.error("Error", e);
  }
};

module.exports = {
  startAlertsCron,
};
