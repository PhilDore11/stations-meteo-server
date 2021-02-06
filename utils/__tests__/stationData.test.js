const stationDataUtil = require("../stationData");

const smallTestData = require("../__mocks__/smallTestData");
const largeTestData = require("../__mocks__/largeTestData");
const xlargeTestData = require("../__mocks__/xlargeTestData");

const smallTestDataResults = {
  5: 8.208,
  10: 6.156,
  15: 5.472,
  30: 4.788,
  60: 3.648,
};

const largeTestDataResults = {
  5: 9.576,
  10: 8.892,
  15: 8.664,
  30: 7.98,
  60: 6.384,
  120: 4.446,
  180: 3.914,
  360: 2.527,
  720: 1.2635,
  1440: 0.637,
};

const xlargeTestDataResults = {
  5: 11.232,
  10: 9.984,
  15: 9.568,
  30: 8.736,
  60: 7.384,
  120: 4.888,
  180: 4.264,
  360: 2.739,
  720: 1.378,
  1440: 0.693,
};

describe("Station Data", () => {
  describe("Test small data set", () => {
    [5, 10, 15, 30, 60].forEach((increment) => {
      test(`should calculate ${increment} min mm/h`, () => {
        expect(
          stationDataUtil.getMaxStationData(smallTestData, increment)
        ).toBeCloseTo(smallTestDataResults[increment], 3);
      });
    });
  });

  describe("Test large data set", () => {
    [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440].forEach((increment) => {
      test(`should calculate ${increment} min mm/h`, () => {
        expect(
          stationDataUtil.getMaxStationData(largeTestData, increment)
        ).toBeCloseTo(largeTestDataResults[increment], 3);
      });
    });
  });

  describe("Test xlarge data set", () => {
    [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440].forEach((increment) => {
      test(`should calculate ${increment} min mm/h`, () => {
        expect(
          stationDataUtil.getMaxStationData(xlargeTestData, increment)
        ).toBeCloseTo(xlargeTestDataResults[increment], 3);
      });
    });
  });
});
