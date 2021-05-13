import React from "react";
import PropTypes from "prop-types";

import { getThresholdFromData } from "../../alertUtils";

import { maxBy, isEmpty } from "lodash";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import {
  blue,
  green,
  yellow,
  orange,
  deepOrange,
  grey,
  red,
} from "@material-ui/core/colors";

const increments = [5, 10, 15, 30, 60, 120, 360, 720, 1440];
const thresholds = [2, 5, 10, 25, 50, 100];
const thresholdColors = {
  2: blue[200],
  5: green[200],
  10: yellow[200],
  25: orange[200],
  50: deepOrange[200],
  100: red[200],
};

const formatIncrementText = (increment) =>
  increment < 60
    ? `${increment} m`
    : increment === 60
    ? `${increment / 60} hr`
    : `${increment / 60} hrs`;

class IdfAlert extends React.PureComponent {
  componentDidMount() {
    const chartCanvas = this.refs.chart;
    const dataURL = chartCanvas.toDataURL();
    const chartImage = this.refs.image;
    chartImage.src = dataURL;
  }

  render() {
    const getThresholdForStation = (
      increment,
      stationIncrementalAlertThresholds,
      averages,
      standardDeviations
    ) => {
      if (!stationIncrementalAlertThresholds) return null;

      return getThresholdFromData(
        stationIncrementalAlertThresholds?.data,
        increment,
        averages,
        standardDeviations
      );
    };

    const getMaxThresholdForStation = (
      stationAlertThresholds,
      averages,
      standardDeviations
    ) =>
      maxBy(Object.keys(stationAlertThresholds), (increment) =>
        parseFloat(
          getThresholdForStation(
            increment,
            stationAlertThresholds?.[increment],
            averages,
            standardDeviations
          )
        )
      );

    return (
      <div>
        <Typography variant="body2">
          Ceci est un message automatique. (Ne pas répondre svp) <br />
          Une précipitation importante a été enregistrée lors des derniers 24h.
        </Typography>
        <br />
        <br />
        <Typography variant="subtitle2">
          Période de retour maximale (ans) pour chaque station
        </Typography>
        <div style={{ display: "flex" }}>
          {Object.keys(this.props.clientRainAlerts).map((key) => {
            const alertThresholds = this.props.clientRainAlerts[key]
              ?.alertThresholds;

            if (isEmpty(alertThresholds)) return null;

            const averages = this.props.clientRainAlerts[key]?.averages;
            const standardDeviations = this.props.clientRainAlerts[key]
              ?.standardDeviations;

            const maxThreshold = getMaxThresholdForStation(
              alertThresholds,
              averages,
              standardDeviations
            );

            const maxAlertThreshold = alertThresholds[maxThreshold];

            return (
              <div
                key={key}
                style={{
                  width: 200,
                  padding: 20,
                  margin: 10,
                  border: "1px solid #E0E0E0",
                  backgroundColor: thresholdColors[maxAlertThreshold?.interval],
                }}
              >
                <Typography variant="subtitle1" align="center">
                  {key}
                </Typography>
                <Typography variant="h5" align="center">
                  {`${
                    getThresholdForStation(
                      maxThreshold,
                      maxAlertThreshold,
                      averages,
                      standardDeviations
                    )?.toFixed(2) || "-"
                  } ans (${formatIncrementText(maxThreshold)})`}
                </Typography>
                <Typography variant="body2" align="center">
                  {`${maxAlertThreshold?.data.toFixed(2)} mm/h`}
                </Typography>
              </div>
            );
          })}
        </div>
        <br />
        <Typography variant="subtitle2">
          Périodes de retour pour chaque station
        </Typography>
        <TableContainer
          component={Paper}
          variant={"outlined"}
          style={{ width: 1000 }}
        >
          <Table size={"small"}>
            <TableHead>
              <TableRow key={0}>
                <TableCell>Station</TableCell>
                {increments.map((increment) => (
                  <TableCell key={increment} align="center" width={50}>
                    {formatIncrementText(increment)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(this.props.clientRainAlerts).map((key) => (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  {increments.map((increment) => (
                    <TableCell
                      key={increment}
                      align="center"
                      style={{
                        backgroundColor:
                          thresholdColors[
                            this.props.clientRainAlerts[key]?.alertThresholds?.[
                              increment
                            ]?.interval
                          ],
                      }}
                    >
                      {getThresholdForStation(
                        increment,
                        this.props.clientRainAlerts[key]?.alertThresholds?.[
                          increment
                        ],
                        this.props.clientRainAlerts[key]?.averages,
                        this.props.clientRainAlerts[key]?.standardDeviations
                      )?.toFixed(2) || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <br />
        <br />
        <Typography variant="body2">
          Pour de plus amples details, s'il vous plait consulter de portail.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="http://stations-jfsa.com"
          style={{ color: grey[50] }}
        >
          Acceder au Portail
        </Button>
      </div>
    );
  }
}

IdfAlert.propTypes = {
  clientRainAlerts: PropTypes.object.isRequired,
};

export { IdfAlert };
