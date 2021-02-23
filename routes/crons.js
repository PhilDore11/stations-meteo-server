const cron = require("node-cron");

const { forEach, isEmpty } = require("lodash");

const db = require("../utils/db");

const { getStationTableName } = require("../utils/stationTableUtils");
const {
  getIncrementalData,
  getReferenceIncrementalData,
  findAlertThresholds,
} = require("../utils/alertUtils");
const { sendRainEmail } = require("../utils/emailUtils");
const { logger } = require("../utils/logger");

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

const getAllStations = `
  SELECT 
    stationId,
    clientId, 
    stations.name as stationName, 
    clients.name as clientName, 
    hasRain, 
    hasSnow, 
    hasWind, 
    hasTemperature, 
    hasHydro 
  FROM stations 
  JOIN clients ON stations.clientId = clients.id
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
  try {
    const stationsResults = await db.connection.query(getAllStations);
    forEach(stationsResults, async (station) => {
      const stationTableName = await getStationTableName(station.stationId);

      if (!stationTableName) return;

      if (station.hasRain) startRainAlertsCron(stationTableName, station);
    });
  } catch (e) {
    console.error("Error starting alerts", e);
  }
};

const startRainAlertsCron = async (stationTableName, station) => {
  // cron.schedule("*/5 * * * *", async () => {
  console.log(`Checking for rain alerts for ${station.stationName}...`);
  try {
    // Station Data
    const stationDataResults = await db.connection.query(
      getStationDataForAlertsQuery(stationTableName),
      [station.stationId]
    );

    if (isEmpty(stationDataResults)) return;

    const incrementalData = getIncrementalData(stationDataResults);

    // Reference Data
    const referenceDataResults = await db.connection.query(
      getReferenceStationQuery,
      [station.stationId]
    );
    const referenceData = getReferenceIncrementalData(referenceDataResults);

    const alertThresholds = findAlertThresholds(incrementalData, referenceData);

    if (!isEmpty(alertThresholds)) {
      const lastTimeEntry = stationDataResults[0].stationDate;

      const alertRowValues = [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(
        (increment) =>
          (alertThresholds[increment] && alertThresholds[increment].interval) ||
          0
      );

      // Retrieve Existing Alert
      const existingAlert = await db.connection.query(getStationAlert, [
        station.stationId,
        lastTimeEntry,
        ...alertRowValues,
      ]);

      if (isEmpty(existingAlert)) {
        console.log(`Sending new alert for ${station.stationName}...`);

        // Add Entry to Alerts Table
        await db.connection.query(insertStationAlert, [
          station.stationId,
          lastTimeEntry,
          ...alertRowValues,
        ]);

        // Client Alert Config
        const clientAlertConfig = await db.connection.query(
          getClientAlertConfig,
          [station.clientId]
        );

        await sendRainEmail(
          clientAlertConfig,
          lastTimeEntry,
          incrementalData,
          alertThresholds
        );
      } else {
        console.log(`Alert already sent for ${station.stationName}...`);
      }
    }
  } catch (e) {
    console.error("Error", e);
  }
  // });
};

module.exports = {
  startAlertsCron,
};
