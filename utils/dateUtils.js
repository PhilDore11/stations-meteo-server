const moment = require("moment-timezone");
moment.locale("fr");

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = `${DATE_FORMAT} HH:mm:ss`;

const getEstMoment = (momentValue) => {
  return moment.utc(momentValue).utcOffset(-5)
}

module.exports = {
  currentDate: () => getEstMoment(),
  convertToDateString: (momentValue) => {
    return getEstMoment(momentValue).format(DATE_FORMAT);
  },
  convertToDateTimeString: (momentValue) => {
    return getEstMoment(momentValue).format(DATETIME_FORMAT);
  },
};
