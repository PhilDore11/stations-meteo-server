const React = require("react");
const ReactDOMServer = require("react-dom/server");
const {
  ServerStyleSheets,
  ThemeProvider,
} = require("@material-ui/core/styles");

const { isEmpty } = require("lodash");

const nodemailer = require("nodemailer");
const { currentDate, convertToDateTimeString } = require("../dateUtils");

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
  sendRainEmail: async (clientAlertConfig, clientRainAlerts, alertDateTime) => {
    try {
      const clientEmails =
        clientAlertConfig &&
        clientAlertConfig
          .map((client) => client.hasRain && client.email)
          .filter(Boolean);

      if (!isEmpty(clientEmails)) {
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
          subject: `${clientEmails} - Alerte de pluie - ${convertToDateTimeString(alertDateTime)}`,
          html: renderFullPage(html, css),
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
