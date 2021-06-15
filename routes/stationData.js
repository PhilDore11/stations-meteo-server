const fs = require("fs");
const { every, forEach, isNumber } = require("lodash");

const converter = require("json-2-csv");

const db = require("../utils/db");
const stationData = require("../utils/stationData");
const dateUtils = require("../utils/dateUtils");
const { getStationTableMeta } = require("../utils/stationTableUtils");
const { convertToDateTimeString } = require("../utils/dateUtils");

const getGroupByClauses = (view, tableName, columns) => {
  switch (view) {
    case "day":
      return [
        `YEAR(${tableName}.${columns["TmStamp"]})`,
        `MONTH(${tableName}.${columns["TmStamp"]})`,
        `DAY(${tableName}.${columns["TmStamp"]})`,
        `HOUR(${tableName}.${columns["TmStamp"]})`,
        `MINUTE(${tableName}.${columns["TmStamp"]})`,
      ];
    case "week":
      return [
        `YEAR(${tableName}.${columns["TmStamp"]})`,
        `MONTH(${tableName}.${columns["TmStamp"]})`,
        `DAY(${tableName}.${columns["TmStamp"]})`,
        `HOUR(${tableName}.${columns["TmStamp"]})`,
      ];
    default:
      return [
        `YEAR(${tableName}.${columns["TmStamp"]})`,
        `MONTH(${tableName}.${columns["TmStamp"]})`,
        `DAY(${tableName}.${columns["TmStamp"]})`,
      ];
  }
};

const getQuery = (view, tableName, columns) => `
  SELECT Min(${tableName}.${columns["TmStamp"]})  AS stationDate, 
         ${columns["Pluie_mm_Tot"]}               AS intensity, 
         Pluie_mm_Validee                         AS adjustedIntensity, 
         Coefficient                              AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON stationId = ? AND 
              ${tableName}.${columns["RecNum"]} = stationData.RecNum AND 
              ${tableName}.${columns["TmStamp"]} = stationData.TmStamp
  WHERE  ${tableName}.${columns["TmStamp"]} BETWEEN ? AND ? 
  GROUP BY ${getGroupByClauses(view, tableName, columns)}
`;

const getLatestQuery = (tableName, columns) => `
  SELECT ${columns["TmStamp"]}      AS date,
         ${columns["RecNum"]}      AS RecNum,
         ${columns["Pluie_mm_Tot"]} AS intensity, 
         ${columns["batt_volt"]}    AS battery
  FROM ${tableName} 
  ORDER  BY ${columns["TmStamp"]} DESC 
  LIMIT  1
`;

const getLatestStationDataQuery = `
  SELECT Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient
  FROM stationData 
  WHERE stationId = ? AND RecNum = ?
`;

const exportQuery = (tableName, columns) => `
  SELECT ${tableName}.${columns["RecNum"]}, 
         ${tableName}.${columns["TmStamp"]}, 
         ${tableName}.${columns["Pluie_mm_Tot"]}, 
         Pluie_mm_Validee, 
         Coefficient
  FROM   ${tableName} 
         LEFT JOIN stationData 
            ON stationId = ? AND 
              ${tableName}.${columns["RecNum"]} = stationData.RecNum AND 
              ${tableName}.${columns["TmStamp"]} = stationData.TmStamp 
  WHERE  ${tableName}.${columns["TmStamp"]} BETWEEN ? AND ? 
  ORDER  BY ${tableName}.${columns["TmStamp"]} 
  `;

const getStationCoefficients = `
  SELECT * FROM stationCoefficients WHERE stationId = ? AND dateModified < ? ORDER BY dateModified DESC;
`;

const insertMissingResultsQuery = (tableName, columns) => `
  INSERT INTO ${tableName} (${columns["TmStamp"]}, ${columns["RecNum"]}) 
  SELECT  stationData.TmStamp, 
          stationData.RecNum 
  FROM    ${tableName} 
          RIGHT JOIN stationData 
              ON ${tableName}.${columns["RecNum"]} = stationData.RecNum 
                  AND ${tableName}.${columns["TmStamp"]} = stationData.TmStamp 
  WHERE   stationId = ? AND ${tableName}.${columns["RecNum"]} IS NULL 
`;

const insertValidatedResultsQuery = `
  INSERT INTO stationData (stationId, RecNum, TmStamp, Pluie_mm_Validee, Coefficient) 
      VALUES ? AS newStationData
  ON DUPLICATE KEY UPDATE 
      Pluie_mm_Validee = newStationData.Pluie_mm_Validee,
      Coefficient = newStationData.Coefficient
`;

const getColumnsFromMeta = (stationColumnMeta) => {
  const columns = {};

  forEach(stationColumnMeta, (columnMeta) => {
    columns[columnMeta.lnColumnName] = columnMeta.dbColumnName;
  });

  return columns;
};

module.exports = {
  get: async (req, res, next) => {
    const { stationId } = req.params;
    const { start, end, view } = req.query;

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    try {
      const { stationTableMeta, stationColumnMeta } = await getStationTableMeta(
        stationId
      );
      const stationDataResults = await db.connection.query(
        getQuery(
          view,
          stationTableMeta.dbTableName,
          getColumnsFromMeta(stationColumnMeta)
        ),
        [stationId, queryStart, queryEnd]
      );

      res.json({
        validated: every(stationDataResults, (result) =>
          isNumber(result.adjustedIntensity)
        ),
        data: stationDataResults.map((dataResult) => ({
          ...dataResult,
          intensity: stationData.getAdjustedIntensity(dataResult),
        })),
      });
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  getLatest: async (req, res, next) => {
    const { stationId } = req.params;

    try {
      const { stationTableMeta, stationColumnMeta } = await getStationTableMeta(
        stationId
      );
      if (!stationTableMeta) return res.json({});

      const columns = getColumnsFromMeta(stationColumnMeta);

      const latestResults = await db.connection.query(
        getLatestQuery(stationTableMeta.dbTableName, columns)
      );
      const latestStationResults = await db.connection.query(
        getLatestStationDataQuery,
        [stationId, latestResults[0].RecNum]
      );

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
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  export: async (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    const queryStart = dateUtils.convertToDateTimeString(start);
    const queryEnd = dateUtils.convertToDateTimeString(end);

    try {
      const { stationTableMeta, stationColumnMeta } = await getStationTableMeta(
        stationId
      );
      const dbTableName = stationTableMeta.dbTableName;

      const stationDataResults = await db.connection.query(
        exportQuery(dbTableName, getColumnsFromMeta(stationColumnMeta)),
        [stationId, queryStart, queryEnd]
      );

      const stationCoefficientsResults = await db.connection.query(
        getStationCoefficients,
        [stationId, queryEnd]
      );

      const filenameStart = dateUtils.convertToDateString(start);
      const filenameEnd = dateUtils.convertToDateString(end);

      const exportFilename = `/tmp/${dbTableName}-${filenameStart}-${filenameEnd}.csv`;

      const jsonData = stationDataResults.map((result) => ({
        stationId,
        RecNum: result.RecNum,
        TmStamp: result.TmStamp,
        Pluie_mm_Tot: isNumber(result.Pluie_mm_Tot)
          ? result.Pluie_mm_Tot.toString()
          : "",
        Pluie_mm_Validee: isNumber(result.Pluie_mm_Validee)
          ? result.Pluie_mm_Validee.toString()
          : "",
        Coefficient: isNumber(result.Coefficient)
          ? result.Coefficient.toString()
          : stationCoefficientsResults.find(
              (stationCoefficient) =>
                stationCoefficient.dateModified <= result.TmStamp
            )?.coefficient,
      }));

      converter.json2csv(
        jsonData,
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
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  import: (req, res, next) => {
    const { stationId } = req.params;

    const file = req.files.file;

    converter.csv2json(
      file.data.toString(),
      async (err, data) => {
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
                  validatedRow.RecNum || 0,
                  validatedRow.TmStamp,
                  validatedRow.Pluie_mm_Validee,
                  validatedRow.Coefficient,
                ]
              : null
          )
          .filter(Boolean);

        try {
          const {
            stationTableMeta,
            stationColumnMeta,
          } = await getStationTableMeta(stationId);
          const importResults = await db.connection.query(
            insertValidatedResultsQuery,
            [values]
          );

          const insertMissingResults = await db.connection.query(
            insertMissingResultsQuery(
              stationTableMeta.dbTableName,
              getColumnsFromMeta(stationColumnMeta)
            ),
            [stationId]
          );

          return res.json({
            importResults,
            insertMissingResults,
          });
        } catch (err) {
          return next(err.sqlMessage);
        }
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
