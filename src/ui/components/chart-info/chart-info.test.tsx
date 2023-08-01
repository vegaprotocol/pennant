import renderer from "react-test-renderer";

import { ChartInfo } from ".";

test("ChartInfo renders correctly", () => {
  const component = renderer.create(
    <ChartInfo bounds={[new Date(2021, 2, 1), new Date(2021, 2, 2)]} />,
  );

  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
