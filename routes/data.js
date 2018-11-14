const moment = require('moment');

const precipitationData = require('./precipitationData.json');

module.exports = (req, res) => {
  const { start, end } = req.query;

  const chartData = precipitationData.filter((data) =>
    moment(data.date).isBetween(moment(start), moment(end))
  );

  res.json(chartData);
};
