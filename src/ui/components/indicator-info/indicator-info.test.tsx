import renderer from "react-test-renderer";

import { IndicatorInfo } from "./indicator-info";

test("IndicatorInfo renders correctly", () => {
  const component = renderer.create(
    <IndicatorInfo
      title="RSI"
      info={[{ id: "index", label: "", value: "100" }]}
    />,
  );

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
