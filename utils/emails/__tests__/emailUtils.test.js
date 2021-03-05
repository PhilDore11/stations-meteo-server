const emailUtils = require("../emailUtils.jsx");

const testClientRainAlerts = {
  "Station d'epuration": {
    incrementalData: {
      5: 35.6496,
      10: 77.0286,
      15: 75.9676,
      30: 61.1136,
      60: 32.891,
      120: 16.4455,
      180: 10.9637,
      360: 5.4818,
      720: 4.9336,
      1440: 2.4668,
    },
    alertThresholds: {
      10: { data: 77.0286, interval: 2, threshold: 71.8513 },
      15: { data: 75.9676, interval: 2, threshold: 57.0365 },
      30: { data: 61.1136, interval: 10, threshold: 57.4302 },
      60: { data: 32.891, interval: 5, threshold: 30.0401 },
      120: { data: 16.4455, interval: 2, threshold: 13.4078 },
      180: { data: 10.9637, interval: 2, threshold: 9.8587 },
      720: { data: 4.9336, interval: 10, threshold: 4.8668 },
      1440: { data: 2.4668, interval: 5, threshold: 2.4438 },
    },
  },
  "Station de filtration": {
    incrementalData: {
      5: 35.6496,
      10: 77.0286,
      15: 75.9676,
      30: 61.1136,
      60: 32.891,
      120: 16.4455,
      180: 10.9637,
      360: 5.4818,
      720: 4.9336,
      1440: 2.4668,
    },
    alertThresholds: {
      10: { data: 77.0286, interval: 2, threshold: 71.8513 },
      15: { data: 75.9676, interval: 2, threshold: 57.0365 },
      30: { data: 61.1136, interval: 10, threshold: 57.4302 },
      60: { data: 32.891, interval: 5, threshold: 30.0401 },
      120: { data: 16.4455, interval: 2, threshold: 13.4078 },
      180: { data: 10.9637, interval: 2, threshold: 9.8587 },
      720: { data: 4.9336, interval: 10, threshold: 4.8668 },
      1440: { data: 2.4668, interval: 5, threshold: 2.4438 },
    },
  },
};

describe("Email Utils", () => {
  describe("sendRainEmail", () => {
    test("should send an email", async () => {
      await emailUtils.sendRainEmail(
        [{ hasRain: true, email: "philippe.dore.11@gmail.com" }],
        testClientRainAlerts,
        "2020-01-01 00:00:00Z",
      );
    });
  });
});
