const util = require("util");

const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "199.103.63.27",
  port: 3306,
  user: "jfsa",
  password: "R5cA!nr6CYT1",
  database: "stationsMeteoDB",
  timezone: "est",
  dateStrings: true,
});
connection.query = util.promisify(connection.query);

module.exports = {
  connection,
  connect: () => connection.connect(),
  disconnect: () => connection.end(),
};
