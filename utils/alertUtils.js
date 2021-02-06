const { forEach, reduce, isEmpty } = require("lodash");
const { getAdjustedIntensity } = require("./stationData");

const idfIntervals = [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

module.exports = {
  getIncrementalData: (stationData) => {
    const latestIdfData = {};
    forEach(idfIntervals, (increment) => {
      const intensity = reduce(
        stationData,
        (sum, data, index) =>
          index < increment / 5 ? (sum += getAdjustedIntensity(data)) : sum,
        0
      );
      latestIdfData[increment] = parseFloat(
        (intensity * (60 / increment)).toFixed(4)
      );
    });

    return latestIdfData;
  },

  getReferenceIncrementalData: (referenceData) => {
    const result = {};
    forEach(idfIntervals, (increment) => {
      const incrementResult = {};
      referenceData.forEach((data) => {
        incrementResult[data.interval] = parseFloat(
          (data.a / Math.pow(data.b + increment, data.c)).toFixed(4)
        );
      });
      result[increment] = incrementResult;
    });
    return result;
  },

  findAlertThreshold: (incrementalData, referenceIncrementalData) => {
    const result = {};
    forEach(referenceIncrementalData, (referenceData, referenceKey) => {
      forEach([2, 5, 10, 25, 50, 100], (alertInterval) => {
        const data = incrementalData[alertInterval];
        if (data / referenceData[alertInterval] > 0.9) {
          result[referenceKey] = {
            interval: alertInterval,
            data: data,
            threshold: referenceData[alertInterval],
            reached: data / referenceData[alertInterval],
          };
        }
      });
    });

    return result;
  },
};
