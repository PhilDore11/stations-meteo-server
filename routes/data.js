const moment = require('moment');
const csv = require('csvtojson');

module.exports = (req, res) => {
  const { start, end } = req.query;

  csv({
    noheader:true,
    headers: ['date','indicator', 'battery', 'intensity']
  })
    .fromFile(__dirname + '/precipitation.dat')
    .then((jsonData) => {
      const chartData = jsonData.filter((jsonData) =>
        moment(jsonData.date).isBetween(moment(start), moment(end))
      );

      res.json(chartData);
    });
};
