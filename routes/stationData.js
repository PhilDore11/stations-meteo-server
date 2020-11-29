const moment = require("moment");

const db = require("./db");
const constants = require("./constants");
const stationData = require("../utils/stationData");

const getStationTableNameQuery = `
  SELECT * FROM LNDBStationMeta WHERE stationId = ?
`;

const getQuery = (tableName) => `
  SELECT Min(TmStamp)     AS stationDate, 
         Pluie_mm_Tot     AS intensity, 
         Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON ${tableName}.RecNum = stationData.RecNum 
  WHERE  TmStamp BETWEEN ? AND ? 
`;

const getLatestQuery = (tableName) => `
  SELECT TmStamp          AS date, 
         ${tableName}.RecNum,
         Pluie_mm_Tot     AS intensity, 
         Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient, 
         batt_volt        AS battery 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON ${tableName}.RecNum = stationData.RecNum 
  ORDER  BY TmStamp DESC 
  LIMIT  1 
`;

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end, view } = req.query;

    let groupByClauses;
    if (view === "day") {
      groupByClauses = [
        "YEAR(TmStamp)",
        "MONTH(TmStamp)",
        "DAY(TmStamp)",
        "HOUR(TmStamp)",
        "MINUTE(TmStamp)",
      ];
    } else if (view === "week") {
      groupByClauses = [
        "YEAR(TmStamp)",
        "MONTH(TmStamp)",
        "DAY(TmStamp)",
        "HOUR(TmStamp)",
      ];
    } else {
      groupByClauses = ["YEAR(TmStamp)", "MONTH(TmStamp)", "DAY(TmStamp)"];
    }

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        db.connection.query(
          getQuery(`${tableNameResults[0].lnStationName}_Precip_5Min`) +
            " GROUP BY " +
            groupByClauses.join(", "),
          [
            moment(start).format(constants.MYSQL_DATETIME_FORMAT),
            moment(end).format(constants.MYSQL_DATETIME_FORMAT),
          ],
          (err, stationDataResults) => {
            if (err) {
              return next(err.sqlMessage);
            }
            res.json(
              stationDataResults.map((dataResult) => ({
                ...dataResult,
                intensity: stationData.getAdjustedIntensity(dataResult),
              }))
            );
          }
        );
      }
    );
  },
  getLatest: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        if (!tableNameResults || tableNameResults.length === 0)
          return res.json({});

        db.connection.query(
          getLatestQuery(`${tableNameResults[0].lnStationName}_Precip_5Min`),
          [],
          (err, latestResults) => {
            if (err) return next(err.sqlMessage);

            const result =
              latestResults && latestResults.length > 0 && latestResults[0];

            res.json({
              ...result,
              intensity: stationData.getAdjustedIntensity(result),
            });
          }
        );
      }
    );
  },
};
