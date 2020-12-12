const db = require("./db");
const _ = require("lodash");
const { writeFileSync } = require("fs");

const stationDataUtils = require("../utils/stationData");
const dateUtils = require("../utils/dateUtils");
const { getStationTableNameQuery } = require("../utils/stationTableUtils");

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
              ON ${tableName}.RecNum = stationData.RecNum AND ${tableName}.TmStamp = stationData.TmStamp 
  WHERE  ( stationId = ? OR stationId IS NULL ) AND ${tableName}.TmStamp BETWEEN ? AND ? 
  GROUP  BY Year(${tableName}.TmStamp), 
    Month(${tableName}.TmStamp), 
    Day(${tableName}.TmStamp), 
    Hour(${tableName}.TmStamp), 
    Minute(${tableName}.TmStamp)
  ORDER BY ${tableName}.TmStamp
`;

module.exports = {
  getReferenceData: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getReferenceDataQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },

  getStationData: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        db.connection.query(
          getStationDataQuery(tableNameResults[0].dbTableName),
          [stationId, queryStart, queryEnd],
          (err, stationDataResults) => {
            if (err) {
              return next(err.sqlMessage);
            }
            let idfStationData = [];

            writeFileSync(
              "/tmp/stationData.js",
              JSON.stringify(stationDataResults)
            );

            if (!_.isEmpty(stationDataResults)) {
              idfStationData = [
                5,
                10,
                15,
                30,
                60,
                120,
                180,
                360,
                720,
                1440,
              ].map((increment) => ({
                increment,
                intensity: stationDataUtils.getMaxStationData(
                  stationDataResults,
                  increment
                ),
              }));
            }

            res.json(idfStationData);
          }
        );
      }
    );
  },
};
