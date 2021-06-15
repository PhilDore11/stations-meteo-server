// add timestamps in front of log messages
require("console-stamp")(console, {
  format: ":date(yyyy/mm/dd HH:MM:ss.l) :label",
});

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const {
  ServerStyleSheets,
  ThemeProvider,
} = require("@material-ui/core/styles");

const { isEmpty } = require("lodash");

const nodemailer = require("nodemailer");
const { convertToDateTimeString } = require("../dateUtils");

const { theme } = require("./templates/theme");
const { IdfAlert } = require("./templates/IdfAlert");

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

function renderFullPage(html, css) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style id="jss-server-side">${css}</style>
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
}

module.exports = {
  sendRainEmail: async (
    client,
    clientAlertConfig,
    clientRainAlerts,
    alertDateTime
  ) => {
    try {
      const clientEmails =
        clientAlertConfig &&
        clientAlertConfig
          .map((client) => client.hasRain && client.email)
          .filter(Boolean);

      if (!isEmpty(clientEmails)) {
        console.debug(
          `EMAIL - ${client.name} - Sending emails to [${clientEmails.join(
            ", "
          )}]...`
        );
        const sheets = new ServerStyleSheets();

        // Render the component to a string.
        const html = ReactDOMServer.renderToString(
          sheets.collect(
            <ThemeProvider theme={theme}>
              <IdfAlert clientRainAlerts={clientRainAlerts} />
            </ThemeProvider>
          )
        );

        // Grab the CSS from the sheets.
        const css = sheets.toString();

        const mailOptions = {
          from: "alerte-orage@jfsa-ftp.com",
          to: clientEmails,
          subject: `${
            client.name
          } - Alerte de pluie - ${convertToDateTimeString(alertDateTime)}`,
          html: renderFullPage(html, css),
          text:
            "Une précipitation importante a été enregistrée lors des derniers 24h",
        };
        await transporter.sendMail(mailOptions);
      } else {
        console.debug(`EMAIL - ${client.name} - No email address found...`);
      }
    } catch (e) {
      console.error("Error sending email", e);
    }
  },
};
