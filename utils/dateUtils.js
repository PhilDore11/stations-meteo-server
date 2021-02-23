const moment = require("moment-timezone");
moment.locale("fr");

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = `${DATE_FORMAT} HH:mm:ss`;

module.exports = {
  currentDate: () => moment(),
  convertToDateString: (momentValue) => {
    return moment.utc(momentValue).local().format(DATE_FORMAT);
  },
  convertToDateTimeString: (momentValue) => {
    return moment.utc(momentValue).local().format(DATETIME_FORMAT);
  },
};
