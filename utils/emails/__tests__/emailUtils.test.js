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
      720: { data: 4.9336, interval: 10, threshold: 4.8668 },
      1440: { data: 2.4668, interval: 5, threshold: 2.4438 },
    },
  },
  "Station de filtration": {
    incrementalData: {
      5: 16.416,
      10: 19.152,
      15: 45.144,
      30: 61.104,
      60: 37.506,
      120: 18.753,
      360: 6.251,
      720: 4.7595,
      1440: 2.3798,
    },
    alertThresholds: {
      30: { data: 61.104, interval: 10, threshold: 57.4302 },
      60: { data: 37.506, interval: 10, threshold: 35.058 },
      120: { data: 18.753, interval: 5, threshold: 17.7639 },
      360: { data: 6.251, interval: 2, threshold: 5.7894 },
      720: { data: 4.7595, interval: 5, threshold: 4.2789 },
      1440: { data: 2.3798, interval: 2, threshold: 1.9725 },
    },
  },
};

describe("Email Utils", () => {
  describe("sendRainEmail", () => {
    test("should send an email", async () => {
      await emailUtils.sendRainEmail(
        { name: "Test Client" },
        [{ hasRain: true, email: "philippe.dore.11@gmail.com" }],
        testClientRainAlerts
      );
    });
  });
});
