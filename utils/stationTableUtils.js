module.exports = {
  getStationTableNameQuery: `
  SELECT * 
  FROM    LNDBStationMeta 
          JOIN LNDBTableMeta 
              ON stationId = LNDBStationMeta_stationID 
  WHERE   ( lnTableName = "Precip_5Min" 
              OR lnTableName = "PluieJFS" ) 
          AND stationId = ? 
`,
};
