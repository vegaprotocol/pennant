import renderer from "react-test-renderer";

import { CandleInfo } from ".";

test("CandleInfo renders correctly", () => {
  const component = renderer.create(
    <CandleInfo
      candle={{
        date: new Date(2021, 1, 1),
        high: 100,
        low: 101,
        open: 102,
        close: 103,
        volume: 104,
      }}
      decimalPlaces={5}
    />
  );

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
