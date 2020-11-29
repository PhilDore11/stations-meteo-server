const _ = require("lodash");

const getAdjustedIntensity = (result) => {
  const intensity = _.isNumber(result.adjustedIntensity)
    ? result.adjustedIntensity
    : result.intensity;
  return result.coefficient
    ? intensity * (0.1 / result.coefficient)
    : intensity;
};

module.exports = {
  getAdjustedIntensity,

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
        (result, data) => result + getAdjustedIntensity(data),
        0
      );

      if (newSum > maxValue) {
        maxValue = newSum;
      }
    });

    return maxValue;
  },
};
