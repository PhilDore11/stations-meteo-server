const db = require("./db");

module.exports = {
  post: (req, res, next) => {
    const {
      clientId,
      stationId,
      name,
      referenceStationId,
      coefficient,
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

    db.connection.query(
      "INSERT INTO stations (clientId, stationId, name, referenceStationId, coefficient, latitude, longitude, ipAddress, deviceType, hasRain, hasSnow, hasWind, hasHydro, localisation, address, city, province, postalCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        clientId,
        stationId,
        name,
        referenceStationId,
        coefficient,
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
      ],
      (clientsErr, results) => {
        if (clientsErr) return next(clientsErr.sqlMessage);

        res.status(200).send(results);
      }
    );
  },
  put: (req, res, next) => {
    const { stationId } = req.params;
    db.connection.query(
      `UPDATE stations SET ? WHERE id=${stationId}`,
      req.body,
      (err) => {
        if (err) return next(err.sqlMessage);

        res.status(200).send({});
      }
    );
  },
  delete: (req, res, next) => {
    const { stationId } = req.params;

    console.log("STATION DELETE", stationId);
    db.connection.query(
      "DELETE from stations WHERE id=?",
      [stationId],
      (err, results) => {
        if (err) return next(err.sqlMessage);

        res.status(200).send(results);
      }
    );
  },
};