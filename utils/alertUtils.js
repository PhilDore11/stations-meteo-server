const { forEach, reduce, isEmpty } = require("lodash");
const { getAdjustedIntensity } = require("./stationData");

const idfIntervals = [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

const getMaxIntervalFromData = (data, referenceData) => {
  const maxInterval = 0;
  forEach(referenceData, (referenceThreshold, referenceThresholdKey) => {
    if (data >= referenceThreshold) {
      maxInterval = parseInt(referenceThresholdKey);
    }
  });

  return maxInterval;
};

const getIncrementalData = (stationData) => {
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
};

const getReferenceIncrementalData = (referenceData) => {
  const referenceVariables = {};
  referenceData.forEach((data) => {
    referenceVariables[data.interval] = {
      a: data.a,
      b: data.b,
      c: data.c,
    };
  });

  const result = { referenceVariables };

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
};

const findAlertThresholds = (incrementalData, referenceIncrementalData) => {
  const result = {};
  forEach(incrementalData, (data, dataKey) => {
    const { maxInterval, referenceData } = getMaxIntervalFromData(
      data,
      referenceIncrementalData[dataKey]
    );
    if (maxInterval > 0) {
      result[dataKey] = {
        data,
        interval: maxInterval,
      };
    }
  });

  return result;
};

module.exports = {
  getMaxIntervalFromData,
  getIncrementalData,
  getReferenceIncrementalData,
  findAlertThresholds,
};
