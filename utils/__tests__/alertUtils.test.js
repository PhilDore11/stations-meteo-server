const alertUtil = require("../alertUtils");

const referenceData = require("../__mocks__/referenceData");
const referenceDataResult = require("../__mocks__/referenceDataResult");

const largeTestData = require("../__mocks__/largeTestData").reverse();
const smallTestData = require("../__mocks__/smallTestData").reverse();

const resultIncrementalDataLarge = {
  5: 0,
  10: 0,
  15: 0,
  30: 0,
  60: 0,
  120: 0,
  180: 0,
  360: 0,
  720: 1.2635,
  1440: 0.6365,
};
const resultIncrementalDataSmall = {
  5: 2.736,
  10: 2.736,
  15: 2.736,
  30: 2.508,
  60: 3.648,
  120: 1.824,
  180: 1.216,
  360: 0.608,
  720: 0.304,
  1440: 0.152,
};

describe("Alert Utils", () => {
  describe("getIncrementalData", () => {
    test("should calculate latest incremental data for 1 hour", () => {
      expect(alertUtil.getIncrementalData(smallTestData)).toEqual(
        resultIncrementalDataSmall
      );
    });
    test("should calculate latest incremental data for full day", () => {
      expect(alertUtil.getIncrementalData(largeTestData)).toEqual(
        resultIncrementalDataLarge
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

  describe("findAlertThresholds", () => {
    test("should find alerts for 1 hour", () => {
      expect(
        alertUtil.findAlertThresholds(
          resultIncrementalDataSmall,
          referenceDataResult
        )
      ).toEqual({});
    });
    test("should find alerts for full day", () => {
      expect(
        alertUtil.findAlertThresholds(
          resultIncrementalDataLarge,
          referenceDataResult
        )
      ).toEqual({});
    });

    test("should find alerts", () => {
      const testReferenceData = {
        5: {
          2: 1,
          5: 2,
          10: 3,
          25: 4,
          50: 5,
          100: 6,
        },
        10: {
          2: 0.8,
          5: 1.4,
          10: 2.0,
          25: 2.5,
          50: 3,
          100: 3.4,
        },
        15: {
          2: 0.6,
          5: 1.0,
          10: 1.2,
          25: 1.8,
          50: 2.1,
          100: 2.3,
        },
        30: {
          2: 0.4,
          5: 0.5,
          10: 0.65,
          25: 0.7,
          50: 0.85,
          100: 1.0,
        },
      };
      expect(
        alertUtil.findAlertThresholds(
          { 5: 1.2, 10: 1.9, 15: 1.5, 30: 0.5 },
          testReferenceData
        )
      ).toEqual({
        5: {
          interval: 2,
          reached: 1.2,
        },
        10: { interval: 5, reached: 1.36 },
        15: { interval: 10, reached: 1.25 },
        30: { interval: 5, reached: 1 },
      });
    });
  });
});
