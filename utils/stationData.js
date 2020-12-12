const _ = require("lodash");

const getAdjustedIntensity = (result) => {
  const intensity = _.isNumber(result.adjustedIntensity)
    ? result.adjustedIntensity
    : result.intensity;
  return result.coefficient
    ? (intensity / 0.1) * result.coefficient
    : intensity;
};

module.exports = {
  getAdjustedIntensity,

  getMaxStationData: (data, interval) => {
    let maxValue = 0;
    const numberOfValues = interval / 5;

    data.forEach((_dataItem, i) => {
      if (i < numberOfValues - 1) return;

      const newDataArray = data.slice(i - numberOfValues + 1, i + 1);

      const newMaxValue = _.reduce(
        newDataArray,
        function (sum, result) {
          return sum + getAdjustedIntensity(result);
        },
        0
      );

      if (newMaxValue > maxValue) {
        maxValue = newMaxValue;
      }
    });

    return maxValue * (60 / interval);
  },
};
