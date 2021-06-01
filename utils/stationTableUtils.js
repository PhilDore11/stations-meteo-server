const { isEmpty } = require("lodash");
const db = require("./db");

const getStationTableMetaQuery = `
  SELECT * 
  FROM    LNDBStationMeta 
          JOIN LNDBTableMeta 
              ON stationId = LNDBStationMeta_stationID 
  WHERE   ( lnTableName = "Precip_5Min" 
              OR lnTableName = "PluieJFS" ) 
          AND stationId = ? 
`;

const getStationColumnMetaQuery = `
  SELECT * FROM LNDBColumnMeta WHERE LNDBTableMeta_tableID = ? 
`;

module.exports = {
  getStationTableMeta: async (stationId) => {
    try {
      const stationTableMetaResults = await db.connection.query(
        getStationTableMetaQuery,
        [stationId]
      );

      if (!isEmpty(stationTableMetaResults)) {
        const stationColumnMetaResults = await db.connection.query(
          getStationColumnMetaQuery,
          [stationTableMetaResults[0].tableID]
        );

        return {
          stationTableMeta: stationTableMetaResults[0],
          stationColumnMeta: stationColumnMetaResults,
        };
      } else {
        return null;
      }
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
