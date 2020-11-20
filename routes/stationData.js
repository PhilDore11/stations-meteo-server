const moment = require("moment");

const db = require("./db");
const constants = require("./constants");

const getStationTableNameQuery = `
  SELECT * FROM LNDBStationMeta WHERE stationId = ?
`;

const getQuery = (tableName) => `
  SELECT MIN(TmStamp) as stationDate, Pluie_mm_Tot as intensity FROM ${tableName} WHERE TmStamp BETWEEN ? AND ?
`;

const getCoefficientQuery = `
  SELECT coefficient FROM stationCoefficients WHERE stationId = ? AND date < ? ORDER BY date DESC LIMIT 1
`;

const getLatestQuery = (tableName) => `
  SELECT TmStamp as date, Pluie_mm_Tot as intensity, batt_volt as battery FROM ${tableName} ORDER BY TmStamp DESC LIMIT 1
`;

const getLatestCoefficientQuery = `
  SELECT coefficient FROM stationCoefficients WHERE stationId = ? ORDER BY date DESC LIMIT 1
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

            db.connection.query(
              getCoefficientQuery,
              [stationId, moment(end).format(constants.MYSQL_DATETIME_FORMAT)],
              (err, coefficientResults) => {
                if (err) return next(err.sqlMessage);

                res.json(
                  stationDataResults.map((result) => ({
                    ...result,
                    intensity:
                      (result.intensity / 0.1) *
                      coefficientResults[0].coefficient,
                  }))
                );
              }
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

        db.connection.query(
          getLatestQuery(`${tableNameResults[0].lnStationName}_Precip_5Min`),
          [],
          (err, latestResults) => {
            if (err) return next(err.sqlMessage);

            db.connection.query(
              getLatestCoefficientQuery,
              [stationId],
              (err, latestCoefficientResults) => {
                if (err) return next(err.sqlMessage);

                res.json({
                  ...latestResults[0],
                  intensity:
                    (latestResults[0].intensity / 0.1) *
                    latestCoefficientResults[0],
                });
              }
            );
          }
        );
      }
    );
  },
};
