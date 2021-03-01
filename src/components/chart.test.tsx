import * as React from "react";

import { render, screen } from "@testing-library/react";

import { Chart } from "./chart";
import { DataSource } from "../types/data-source";
import { Interval } from "../api/vega-graphql";

const mockDataSource: DataSource = {
  decimalPlaces: 2,
  query: () => {
    return Promise.resolve([]);
  },
  subscribe: () => {},
  unsubscribe: () => {},
};

it("renders empty chart", () => {
  render(
    <Chart
      dataSource={mockDataSource}
      interval={Interval.I15M}
      onSetInterval={console.log}
    />
  );
  expect(screen.getByText("Candle")).toBeInTheDocument();
});
