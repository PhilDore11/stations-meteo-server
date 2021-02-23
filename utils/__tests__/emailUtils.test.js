const emailUtils = require("../emailUtils");

describe.skip("Email Utils", () => {
  describe("sendRainEmail", () => {
    test("should send an email", async () => {
      await emailUtils.sendRainEmail(
        [{ hasRain: true, email: "philippe.dore.11@gmail.com" }],
        "2020-01-01 00:00:00",
        null,
        null
      );
    });
  });
});
