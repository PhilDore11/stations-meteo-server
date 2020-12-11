const fs = require("fs");
const { every, isNumber } = require("lodash");

const converter = require("json-2-csv");

const db = require("./db");
const stationData = require("../utils/stationData");
const dateUtils = require("../utils/dateUtils");

const getStationTableNameQuery = `
  SELECT * FROM LNDBStationMeta JOIN LNDBTableMeta ON stationId = LNDBStationMeta_stationID WHERE lnTableName = "Precip_5Min" AND stationId = ?
`;

const getQuery = (tableName) => `
  SELECT Min(TmStamp)     AS stationDate, 
         Pluie_mm_Tot     AS intensity, 
         Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON ${tableName}.RecNum = stationData.RecNum 
  WHERE  ( stationId = ? OR stationId IS NULL ) AND TmStamp BETWEEN ? AND ? 
`;

const getLatestQuery = (tableName) => `
  SELECT TmStamp          AS date,
         RecNum,
         Pluie_mm_Tot     AS intensity, 
         batt_volt        AS battery
  FROM ${tableName} 
  ORDER  BY TmStamp ASC 
  LIMIT  1
`;

const getLatestStationDataQuery = `
  SELECT Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient
  FROM stationData 
  WHERE stationId = ? AND RecNum = ?
`;

const exportQuery = (tableName) => `
  SELECT ${tableName}.RecNum, 
         TmStamp, 
         Pluie_mm_Tot, 
         Pluie_mm_Validee, 
         Coefficient
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON ${tableName}.RecNum = stationData.RecNum 
  WHERE  ( stationId = ? OR stationId IS NULL ) AND TmStamp BETWEEN ? AND ? 
  ORDER  BY TmStamp 
  `;

const clearValidatedResultsQuery = `
  DELETE FROM stationData WHERE (stationId, RecNum) IN (?)
`;

const insertValidatedResultsQuery = `
  INSERT INTO stationData (stationId, RecNum, Pluie_mm_Validee, Coefficient) VALUES ?
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

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        db.connection.query(
          getQuery(tableNameResults[0].dbTableName) +
            " GROUP BY " +
            groupByClauses.join(", "),
          [stationId, queryStart, queryEnd],
          (err, stationDataResults) => {
            if (err) {
              return next(err.sqlMessage);
            }
            res.json({
              validated: every(stationDataResults, (result) =>
                isNumber(result.adjustedIntensity)
              ),
              data: stationDataResults.map((dataResult) => ({
                ...dataResult,
                intensity: stationData.getAdjustedIntensity(dataResult),
              })),
            });
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
          getLatestQuery(tableNameResults[0].dbTableName),
          [],
          (err, latestResults) => {
            if (err) return next(err.sqlMessage);

            db.connection.query(
              getLatestStationDataQuery,
              [stationId, latestResults[0].RecNum],
              (err, latestStationResults) => {
                if (err) return next(err.sqlMessage);

                const result =
                  latestResults && latestResults.length > 0 && latestResults[0];
                const stationResult =
                  latestStationResults &&
                  latestStationResults.length > 0 &&
                  latestStationResults[0];

                res.json({
                  ...result,
                  intensity: stationData.getAdjustedIntensity({
                    ...result,
                    ...stationResult,
                  }),
                });
              }
            );
          }
        );
      }
    );
  },

  export: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        const dbTableName = tableNameResults[0].dbTableName;

        db.connection.query(
          exportQuery(dbTableName),
          [stationId, queryStart, queryEnd],
          (err, stationDataResults) => {
            if (err) {
              return next(err.sqlMessage);
            }

            const filenameStart = dateUtils.convertToDateString(start);
            const filenameEnd = dateUtils.convertToDateString(end);

            const exportFilename = `/tmp/${dbTableName}-${filenameStart}-${filenameEnd}.csv`;

            converter.json2csv(
              stationDataResults.map((result) => ({
                stationId,
                RecNum: result.RecNum,
                TmStamp: dateUtils.convertToDateTimeString(result.TmStamp),
                Pluie_mm_Tot: result.Pluie_mm_Tot.toString(),
                Pluie_mm_Validee: result.Pluie_mm_Validee.toString(),
                Coefficient: result.Coefficient.toString(),
              })),
              (err, csv) => {
                if (err) {
                  return next(err);
                }

                fs.writeFile(exportFilename, csv, (err) => {
                  if (err) {
                    return next(err);
                  }

                  res.download(exportFilename);
                });
              },
              { emptyFieldValue: "" }
            );
          }
        );
      }
    );
  },

  import: (req, res, next) => {
    const { stationId } = req.params;

    const file = req.files.file;

    converter.csv2json(
      file.data.toString(),
      (err, data) => {
        if (err) {
          return next(err);
        }

        // Check the stationId
        if (
          data &&
          data.length > 0 &&
          data[0].stationId !== parseInt(stationId, 10)
        ) {
          return next("Attempting to import for the wrong station.");
        }

        const values = data
          .map((validatedRow) =>
            isNumber(validatedRow.Pluie_mm_Validee) ||
            isNumber(validatedRow.Coefficient)
              ? [
                  stationId,
                  validatedRow.RecNum,
                  validatedRow.Pluie_mm_Validee,
                  validatedRow.Coefficient,
                ]
              : null
          )
          .filter(Boolean);

        const existingValues = values.map((value) => value.slice(0, 2));

        db.connection.query(
          clearValidatedResultsQuery,
          [existingValues],
          (err, clearResults) => {
            if (err) {
              return next(err);
            }

            db.connection.query(
              insertValidatedResultsQuery,
              [values],
              (err, importResults) => {
                if (err) {
                  return next(err);
                }

                res.json(importResults);
              }
            );
          }
        );
      },
      {
        delimiter: { eol: "\r\n" },
        trimHeaderFields: true,
        trimFieldValues: true,
        fields: [
          "RecNum",
          "TmStamp",
          "Pluie_mm_Tot",
          "Pluie_mm_Validee",
          "Coefficient",
        ],
      }
    );
  },
};
