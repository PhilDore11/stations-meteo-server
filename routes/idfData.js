const db = require("./db");
const _ = require("lodash");

const stationDataUtils = require("../utils/stationData");

const getQuery = `
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

const getStationQuery = `
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
                                  WHERE  stationCoefficients.date < ?
                                  GROUP  BY stationId) AS max 
                              ON ( stationCoefficients.stationId = max.stationId 
                                   AND stationCoefficients.date = max.date )) AS 
                coefficients 
           ON ( stations.id = coefficients.stationId ) 
  WHERE  stationData.stationId = ? 
         AND ( stationData.date BETWEEN ? AND ? ) 
  GROUP  BY Year(stationData.date), 
            Month(stationData.date), 
            Day(stationData.date), 
            Hour(stationData.date), 
            Minute(stationData.date) 
`;

module.exports = {
  get: (req, res, next) => {
    const { stationId } = req.params;

    db.connection.query(getQuery, [stationId], (err, results) => {
      if (err) return next(err.sqlMessage);

      res.json(results);
    });
  },

  getStationData: (req, res, next) => {
    const { stationId } = req.params;
    const { start, end } = req.query;

    db.connection.query(
      getStationQuery,
      [end, stationId, start, end],
      (err, results) => {
        if (err) {
          debugger;
          return next(err.sqlMessage);
        }

        let idfStationData = [];
        if (!_.isEmpty(results)) {
          idfStationData = [5, 10, 15, 30, 60, 120, 360, 720, 1440].map(
            (increment) => ({
              increment,
              intensity: stationDataUtils.getMaxStationData(results, increment),
            })
          );
        }

        res.json(idfStationData);
      }
    );
  },
};
