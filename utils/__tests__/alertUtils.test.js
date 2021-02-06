const alertUtil = require("../alertUtils");

const largeTestData = require("../__mocks__/largeTestData");
const referenceData = require("../__mocks__/referenceData");
const referenceDataResult = require("../__mocks__/referenceDataResult");
const smallTestData = require("../__mocks__/smallTestData");

const testIncrementalDataLarge = {
  5: 0,
  10: 0,
  15: 0,
  30: 0,
  60: 0,
  120: 0,
  180: 0,
  360: 0.019,
  720: 0.0095,
  1440: 0.6365,
};
const testIncrementalDataSmall = {
  10: 2.736,
  120: 1.824,
  1440: 0.152,
  15: 4.104,
  180: 1.216,
  30: 4.788,
  360: 0.608,
  5: 2.736,
  60: 3.648,
  720: 0.304,
};

describe("Alert Utils", () => {
  describe("getIncrementalData", () => {
    test("should calculate latest incremental data for 1 hour", () => {
      expect(alertUtil.getIncrementalData(smallTestData)).toEqual({});
    });
    test("should calculate latest incremental data for full day", () => {
      expect(alertUtil.getIncrementalData(largeTestData)).toEqual(
        testIncrementalDataLarge
      );
    });
  });

  describe("getReferenceIncrementalData", () => {
    test("should calculate reference station incremental data", () => {
      expect(alertUtil.getReferenceIncrementalData(referenceData)).toEqual(
        referenceDataResult
      );
    });
  });
  describe("findAlertThreshold", () => {
    test.only("should find alerts for 1 hour", () => {
      expect(
        alertUtil.findAlertThreshold(
          testIncrementalDataSmall,
          referenceDataResult
        )
      ).toEqual({
        1440: {
          data: 2.736,
          interval: 10,
          reached: 0.9934640522875817,
          threshold: 2.754,
        },
      });
    });
    test("should find alerts for full day", () => {
      expect(
        alertUtil.findAlertThreshold(
          testIncrementalDataLarge,
          referenceDataResult
        )
      ).toEqual({});
    });
  });
});
