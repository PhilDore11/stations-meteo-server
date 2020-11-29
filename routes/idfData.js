const db = require("./db");
const _ = require("lodash");

const stationDataUtils = require("../utils/stationData");

const getStationTableNameQuery = `
  SELECT * FROM LNDBStationMeta WHERE stationId = ?;
`;

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
  SELECT Min(TmStamp)     AS stationDate, 
         Pluie_mm_Tot     AS intensity, 
         Pluie_mm_Validee AS adjustedIntensity, 
         Coefficient      AS coefficient 
  FROM   ${tableName} 
         LEFT JOIN stationData 
              ON ${tableName}.RecNum = stationData.RecNum 
  WHERE  TmStamp BETWEEN ? AND ? 
  GROUP  BY Year(TmStamp), 
    Month(TmStamp), 
    Day(TmStamp), 
    Hour(TmStamp), 
    Minute(TmStamp) 
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

    db.connection.query(
      getStationTableNameQuery,
      [stationId],
      (err, tableNameResults) => {
        if (err) return next(err.sqlMessage);

        db.connection.query(
          getStationDataQuery(
            `${tableNameResults[0].lnStationName}_Precip_5Min`
          ),
          [start, end],
          (err, stationDataResults) => {
            if (err) {
              return next(err.sqlMessage);
            }
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

            res.json(idfStationData);
          }
        );
      }
    );
  },
};
