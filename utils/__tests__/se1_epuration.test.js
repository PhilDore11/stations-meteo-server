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
      "10:2",
      "15:2",
      "30:10",
      "60:5",
      "120:2",
      "180:2",
      "720:10",
      "1440:2",
    ],
    "2019-07-11 17:40:00": [
      "30:5",
      "60:5",
      "120:2",
      "180:2",
      "720:5",
      "1440:2",
    ],
    "2019-07-11 17:45:00": [
      "30:2",
      "60:5",
      "120:2",
      "180:2",
      "720:5",
      "1440:2",
    ],
    "2019-07-11 17:50:00": [
      "30:2",
      "60:5",
      "120:2",
      "180:2",
      "720:5",
      "1440:2",
    ],
    "2019-07-11 17:55:00": ["60:5", "120:2", "180:2", "720:5", "1440:2"],
    "2019-07-11 18:00:00": ["60:5", "120:2", "180:2", "720:5", "1440:2"],
    "2019-07-11 18:05:00": ["60:5", "120:2", "180:2", "720:5", "1440:2"],
    "2019-07-11 18:10:00": ["60:2", "120:2", "180:2", "720:5", "1440:2"],
    "2019-07-11 18:15:00": ["60:2", "120:2", "180:2", "720:5", "1440:2"],
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
      const expectedResult = alertExpectedResults[lastDataEntry.stationDate];

      if (expectedResult) {
        const actualResults = Object.keys(alertThresholds).map(
          (key) =>
            `${key}:${parseFloat(
              alertThresholds[key].interval * alertThresholds[key].reached
            ).toFixed(2)}`
        );
        expect(actualResults).toEqual(expectedResult);
      } else {
        expect(alertThresholds).toEqual({});
      }
    });
  }
});
