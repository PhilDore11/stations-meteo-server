const _ = require("lodash");

module.exports = {
  getMaxStationData: (data, interval) => {
    let maxValue = 0;
    const arrayOfIndexes = Array.from({ length: interval / 5 }, (v, k) => k);

    const dataLength = data.length;

    data.forEach((dataItem, i) => {
      const subStationData = _.reduce(
        arrayOfIndexes,
        (result, index) => {
          if (i + index < dataLength) {
            return _.concat(result, data[i + index]);
          }

          return result;
        },
        []
      );

      const newSum = _.reduce(
        subStationData,
        (result, data) => result + data.intensity,
        0
      );

      if (newSum > maxValue) {
        maxValue = newSum;
      }
    });

    return maxValue;
  },
};
