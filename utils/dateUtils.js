const moment = require("moment-timezone");
moment.locale("fr");

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = `${DATE_FORMAT} HH:mm:ss`;

const getMoment = (momentValue) => {
  return moment.utc(momentValue).utcOffset(-5)
}

module.exports = {
  getMoment,
  convertToDateString: (momentValue) => {
    return getMoment(momentValue).format(DATE_FORMAT);
  },
  convertToDateTimeString: (momentValue) => {
    return getMoment(momentValue).format(DATETIME_FORMAT);
  },
};
