const { isEmpty } = require("lodash");

const nodemailer = require("nodemailer");
const { currentDate, convertToDateTimeString } = require("./dateUtils");

const transporter = nodemailer.createTransport({
  host: "mail.jfsa-ftp.com",
  port: 465,
  secure: true,
  connectionTimeout: 2000,
  auth: {
    user: "alerte-orage@jfsa-ftp.com",
    pass: "GQ6=#t{m97Yg",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  sendRainEmail: async (
    clientAlertConfig,
    lastTimeEntry,
    incrementalData,
    alertThresholds
  ) => {
    try {
      const clientEmails =
        clientAlertConfig &&
        clientAlertConfig
          .map((client) => client.hasRain && client.email)
          .filter(Boolean);

      if (!isEmpty(clientEmails)) {
        const mailOptions = {
          from: "alerte-orage@jfsa-ftp.com",
          to: clientEmails,
          subject: `${clientEmails} - Alerte de pluie - ${convertToDateTimeString(
            lastTimeEntry
          )}`,
          text:
            "Une précipitation importante a été enregistrée lors des derniers 24h",
        };
        await transporter.sendMail(mailOptions);
      }
    } catch (e) {
      console.error("Error sending email", e);
    }
  },
};
