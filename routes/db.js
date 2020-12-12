const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "stations-meteo.c7abk9qcbiox.ca-central-1.rds.amazonaws.com",
  port: 3306,
  user: "admin",
  password: "Chanelle1",
  database: "stationsMeteoDB",
});

module.exports = {
  connection,
  connect: () => connection.connect(),
  disconnect: () => connection.end(),
};
