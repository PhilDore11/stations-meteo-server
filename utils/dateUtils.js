const moment = require("moment-timezone");
moment.locale("fr");

const TIME_ZONE = "America/Toronto";

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = `${DATE_FORMAT} HH:mm:ss`;

module.exports = {
  convertToDateString: (momentValue) => {
    return moment.utc(momentValue).tz(TIME_ZONE).format(DATE_FORMAT);
  },
  convertToDateTimeString: (momentValue) => {
    return moment.utc(momentValue).tz(TIME_ZONE).format(DATETIME_FORMAT);
  },
};
