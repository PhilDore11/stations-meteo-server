const { isEmpty } = require("lodash");
const db = require("./db");

const getStationTableNameQuery = `
  SELECT * 
  FROM    LNDBStationMeta 
          JOIN LNDBTableMeta 
              ON stationId = LNDBStationMeta_stationID 
  WHERE   ( lnTableName = "Precip_5Min" 
              OR lnTableName = "PluieJFS" ) 
          AND stationId = ? 
`;

module.exports = {
  getStationTableNameQuery,

  getStationTableName: async (stationId) => {
    const lnTableNameResults = await db.connection.query(
      getStationTableNameQuery,
      [stationId]
    );

    return !isEmpty(lnTableNameResults) && lnTableNameResults[0].dbTableName;
  },
};
