const db = require("../utils/db");
const _ = require("lodash");

const stationDataUtils = require("../utils/stationData");
const dateUtils = require("../utils/dateUtils");
const { getStationTableMeta } = require("../utils/stationTableUtils");

const getReferenceDataQuery = `
  SELECT 
    referenceStations.name,
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

const getStationDataQuery = (tableName) => `
  SELECT Min(${tableName}.TmStamp)    AS stationDate, 
         Pluie_mm_Tot                 AS intensity, 
         Pluie_mm_Validee             AS adjustedIntensity, 
         Coefficient                  AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON stationId = ? AND ${tableName}.RecNum = stationData.RecNum AND ${tableName}.TmStamp = stationData.TmStamp 
  WHERE  ${tableName}.TmStamp BETWEEN ? AND ? 
  GROUP  BY Year(${tableName}.TmStamp), 
    Month(${tableName}.TmStamp), 
    Day(${tableName}.TmStamp), 
    Hour(${tableName}.TmStamp), 
    Minute(${tableName}.TmStamp)
  ORDER BY ${tableName}.TmStamp
`;

module.exports = {
  getReferenceData: async (req, res, next) => {
    const { stationId } = req.params;

    try {
      const results = await db.connection.query(getReferenceDataQuery, [
        stationId,
      ]);
      return res.json(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  getStationData: async (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    try {
      const { stationTableMeta } = await getStationTableMeta(stationId);

      const stationDataResults = await db.connection.query(
        getStationDataQuery(stationTableMeta.dbTableName),
        [stationId, queryStart, queryEnd]
      );

      let idfStationData = [];

      if (!_.isEmpty(stationDataResults)) {
        idfStationData = [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(
          (increment) => ({
            increment,
            intensity: stationDataUtils.getMaxStationData(
              stationDataResults,
              increment
            ),
          })
        );
      }

      return res.json(idfStationData);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
