import "jest-extended";

import { render, waitFor } from "@testing-library/react";

import { DataSource } from "../..";
import { Interval } from "../../types";
import { Chart } from "./chart";

test("calls onReady before subscribeData", async () => {
  const onReady = jest.fn();
  const query = jest.fn();
  const subscribeData = jest.fn();
  const unsubscribeData = jest.fn();

  onReady.mockReturnValue({ priceMonitoringBounds: [] });
  query.mockReturnValue([]);
  subscribeData.mockReturnValue([]);

  const dataSource: DataSource = {
    decimalPlaces: 0,
    onReady: onReady,
    query: query,
    subscribeData: subscribeData,
    unsubscribeData: unsubscribeData,
  };

  render(<Chart dataSource={dataSource} interval={Interval.I1M} />);

  // TODO: What we really want to test for is that the call to onReady has resolved before calling query or subscribeData
  await waitFor(() => expect(onReady).toHaveBeenCalledBefore(query));
  await waitFor(() => expect(onReady).toHaveBeenCalledBefore(subscribeData));
});
