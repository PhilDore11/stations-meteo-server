import React from "react";
import PropTypes from "prop-types";

import { maxBy } from "lodash";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import { Line } from "react-chartjs-2";

import {
  blue,
  green,
  yellow,
  orange,
  deepOrange,
  grey,
  red,
  purple,
} from "@material-ui/core/colors";

const increments = [5, 15, 30, 60, 120, 180, 360, 720, 1440];
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

const data = {
  labels: [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440],
  datasets: [
    {
      label: "Station d'epuration",
      fill: false,
      lineTension: 0.1,
      backgroundColor: grey[800],
      pointRadius: 1,
      data: [0, 2, 2, 10, 5, 2, 2, 0, 10, 5],
    },
    ...thresholds.map((threshold) => ({
      label: `HIDE ${threshold}`,
      data: increments.map((increment) => threshold),
      pointRadius: 1,
      backgroundColor: thresholdColors[threshold],
      borderColor: thresholdColors[threshold],
    })),
  ],
};

const options = {
  maintainAspectRatio: false,

  legend: {
    labels: {
      filter: (item) => !item.text.startsWith("HIDE"),
    },
  },
  scales: {
    xAxes: [
      {
        ticks: {
          min: 0,
          max: 1440,
          callback: (value, index) => formatIncrementText(value),
        },
      },
    ],
    yAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: "Periode de retour (ans)",
        },
        type: "logarithmic",
        ticks: {
          min: 1,
          max: 100,
          callback: (value) => Number(value.toString()),
        },
      },
    ],
  },
};

class IdfAlert extends React.PureComponent {
  componentDidMount() {
    const chartCanvas = this.refs.chart;
    const dataURL = chartCanvas.toDataURL();
    const chartImage = this.refs.image;
    chartImage.src = dataURL;
  }

  render() {
    const getThresholdForStation = (stationIncrementalAlertThresholds) => {
      return stationIncrementalAlertThresholds
        ? (
            (stationIncrementalAlertThresholds?.data /
              stationIncrementalAlertThresholds?.threshold) *
            stationIncrementalAlertThresholds?.interval
          ).toFixed(2)
        : "-";
    };

    const getMaxThresholdForStation = (stationAlertThresholds) => {
      return maxBy(Object.keys(stationAlertThresholds), (increment) =>
        parseFloat(getThresholdForStation(stationAlertThresholds?.[increment]))
      );
    };

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
          {Object.keys(this.props.clientRainAlerts).map((key) => (
            <div
              key={key}
              style={{
                width: 200,
                padding: 20,
                margin: 10,
                border: "1px solid #E0E0E0",
                backgroundColor:
                  thresholdColors[
                    this.props.clientRainAlerts[key]?.alertThresholds[
                      getMaxThresholdForStation(
                        this.props.clientRainAlerts[key]?.alertThresholds
                      )
                    ]?.interval
                  ],
              }}
            >
              <Typography variant="subtitle1" align="center">
                {key}
              </Typography>
              <Typography variant="h5" align="center">
                {`${getThresholdForStation(
                  this.props.clientRainAlerts[key]?.alertThresholds[
                    getMaxThresholdForStation(
                      this.props.clientRainAlerts[key]?.alertThresholds
                    )
                  ]
                )} ans (${formatIncrementText(
                  getMaxThresholdForStation(
                    this.props.clientRainAlerts[key]?.alertThresholds
                  )
                )})`}
              </Typography>
              <Typography variant="body2" align="center">
                {`${this.props.clientRainAlerts[key]?.alertThresholds[
                  getMaxThresholdForStation(
                    this.props.clientRainAlerts[key]?.alertThresholds
                  )
                ]?.data.toFixed(2)} mm/h`}
              </Typography>
            </div>
          ))}
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
                        this.props.clientRainAlerts[key]?.alertThresholds?.[
                          increment
                        ]
                      )}
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
