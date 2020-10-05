const moment = require("moment");

const db = require("./db");
const constants = require("./constants");

const getQuery = `
  SELECT Min(stationData.date)                                       AS stationDate, 
         Sum(stationData.intensity) / 0.1 * coefficients.coefficient AS intensity 
  FROM   stationData 
         JOIN stations 
           ON stationData.stationId = stations.stationId 
         JOIN 
                (SELECT stationCoefficients.* 
               FROM   stationCoefficients 
                      INNER JOIN (SELECT stationId, 
                                         Max(date) AS date 
                                  FROM   stationCoefficients 
                                  WHERE  date < ? 
                                  GROUP  BY stationId) AS max 
                              ON ( stationCoefficients.stationId = max.stationId 
                                   AND stationCoefficients.date = max.date )) AS 
                coefficients 
           ON ( stations.id = coefficients.stationId ) 
  WHERE  stationData.stationId = ? 
         AND ( stationData.date BETWEEN ? AND ? ) 
`;

const getLatestQuery = `
  SELECT stationData.date, 
         stationData.battery, 
         stationData.intensity / 0.1 * coefficients.coefficient AS intensity 
  FROM   stationData 
         JOIN stations 
           ON stationData.stationId = stations.stationId 
         JOIN 
                (SELECT stationCoefficients.* 
               FROM   stationCoefficients 
                      INNER JOIN (SELECT stationId, 
                                         Max(date) AS date 
                                  FROM   stationCoefficients 
                                  GROUP  BY stationId) AS max 
                              ON ( stationCoefficients.stationId = max.stationId 
                                   AND stationCoefficients.date = max.date )) AS 
                coefficients 
           ON ( stations.id = coefficients.stationId ) 
  WHERE  stationData.stationId = ? 
  ORDER  BY date DESC 
  LIMIT  1; 
`;

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end, view } = req.query;

    let groupByClauses;
    if (view === "day") {
      groupByClauses = [
        "YEAR(stationData.date)",
        "MONTH(stationData.date)",
        "DAY(stationData.date)",
        "HOUR(stationData.date)",
        "MINUTE(stationData.date)",
      ];
    } else if (view === "week") {
      groupByClauses = [
        "YEAR(stationData.date)",
        "MONTH(stationData.date)",
        "DAY(stationData.date)",
        "HOUR(stationData.date)",
      ];
    } else {
      groupByClauses = [
        "YEAR(stationData.date)",
        "MONTH(stationData.date)",
        "DAY(stationData.date)",
      ];
    }

    const query = getQuery + " GROUP BY " + groupByClauses.join(", ");

    db.connection.query(
      query,
      [
        moment(end).format(constants.MYSQL_DATETIME_FORMAT),
        stationId,
        moment(start).format(constants.MYSQL_DATETIME_FORMAT),
        moment(end).format(constants.MYSQL_DATETIME_FORMAT),
      ],
      (err, results) => {
        if (err) {
          debugger;
          return next(err.sqlMessage);
        }

        res.json(results);
      }
    );
  },
  getLatest: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getLatestQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results[0] || {});
    });
  },
};
