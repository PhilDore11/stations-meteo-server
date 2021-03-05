const alertUtil = require("../alertUtils");

const referenceData = require("../__mocks__/referenceData");
const se1EpurationData = require("../__mocks__/se1_epuration");

describe("Saint-Eustache Epuration Alerts", () => {
  const alertExpectedResults = {
    "2019-07-11 17:25:00": ["15:2.24", "30:2.20", "720:2.28"],
    "2019-07-11 17:30:00": [
      "5:2.38",
      "10:5.05",
      "15:5.20",
      "30:10.30",
      "60:2.66",
      "120:2.24",
      "180:2.02",
      "720:5.50",
      "1440:2.38",
    ],
    "2019-07-11 17:35:00": [
      "10:2.14",
      "15:2.66",
      "30:10.60",
      "60:5.45",
      "120:2.46",
      "180:2.22",
      "720:10.10",
      "1440:5.05",
    ],
    "2019-07-11 17:40:00": [
      "30:10.30",
      "60:5.60",
      "120:2.52",
      "180:2.28",
      "720:10.30",
      "1440:5.10",
    ],
    "2019-07-11 17:45:00": [
      "30:2.62",
      "60:5.70",
      "120:2.54",
      "180:2.32",
      "720:10.40",
      "1440:5.15",
    ],
    "2019-07-11 17:50:00": [
      "30:2.24",
      "60:5.70",
      "120:2.56",
      "180:2.32",
      "720:10.40",
      "1440:5.15",
    ],
    "2019-07-11 17:55:00": [
      "60:5.70",
      "120:2.56",
      "180:2.32",
      "720:10.40",
      "1440:5.15",
    ],
    "2019-07-11 18:00:00": [
      "60:5.70",
      "120:2.58",
      "180:2.34",
      "720:10.40",
      "1440:5.20",
    ],
    "2019-07-11 18:05:00": [
      "60:5.40",
      "120:2.60",
      "180:2.36",
      "360:2.00",
      "720:10.50",
      "1440:5.20",
    ],
    "2019-07-11 18:10:00": [
      "60:5.10",
      "120:2.60",
      "180:2.36",
      "360:2.00",
      "720:10.50",
      "1440:5.20",
    ],
    "2019-07-11 18:15:00": [
      "60:2.22",
      "120:2.62",
      "180:2.38",
      "360:2.02",
      "720:10.50",
      "1440:5.25",
    ],
  };

  for (let i = 0; i < 220; i++) {
    const lastDataEntry = se1EpurationData[i];
    it(`should check alerts at ${lastDataEntry.stationDate}`, () => {
      const testData = se1EpurationData.slice(0, i + 1).reverse();
      const testIncrementalData = alertUtil.getIncrementalData(testData);
      const testReferenceIncrementalData = alertUtil.getReferenceIncrementalData(
        referenceData
      );

      const alertThresholds = alertUtil.findAlertThresholds(
        testIncrementalData,
        testReferenceIncrementalData
      );

      if (lastDataEntry.stationDate == "2019-07-11 17:35:00") {
        console.log("testData", testData);
        console.log("testIncrementalData", testIncrementalData);
        console.log("testReferenceIncrementalData", testReferenceIncrementalData);
        console.log("alertThresholds", alertThresholds);
      }

      const expectedResult = alertExpectedResults[lastDataEntry.stationDate];

      if (expectedResult) {
        const actualResults = Object.keys(alertThresholds).map(
          (key) =>
            `${key}:${parseFloat(alertThresholds[key].data).toFixed(
              2
            )}:${parseFloat(alertThresholds[key].threshold).toFixed(2)}`
        );
        expect(actualResults).toEqual(expectedResult);
      }
    });
  }
});
