const db = require("../utils/db");

module.exports = {
  post: async (req, res, next) => {
    const {
      clientId,
      stationId,
      name,
      referenceStationId,
      latitude,
      longitude,
      ipAddress,
      deviceType,
      hasRain,
      hasSnow,
      hasWind,
      hasHydro,
      localisation,
      address,
      city,
      province,
      postalCode,
    } = req.body;

    try {
      const results = await db.connection.query(
        "INSERT INTO stations (clientId, stationId, name, referenceStationId, latitude, longitude, ipAddress, deviceType, hasRain, hasSnow, hasWind, hasHydro, localisation, address, city, province, postalCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          clientId,
          stationId,
          name,
          referenceStationId,
          latitude,
          longitude,
          ipAddress,
          deviceType,
          hasRain,
          hasSnow,
          hasWind,
          hasHydro,
          localisation,
          address,
          city,
          province,
          postalCode,
        ]
      );
      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  put: async (req, res, next) => {
    const { stationId } = req.params;

    try {
      await db.connection.query(
        `UPDATE stations SET ? WHERE id=${stationId}`,
        req.body
      );
      return res.status(200).send({});
    } catch (err) {
      return next(err.sqlMessage);
    }
  },

  delete: async (req, res, next) => {
    const { stationId } = req.params;

    try {
      const results = await db.connection.query(
        "DELETE from stations WHERE id=?",
        [stationId]
      );

      return res.status(200).send(results);
    } catch (err) {
      return next(err.sqlMessage);
    }
  },
};
