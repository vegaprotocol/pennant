[![Netlify Status](https://api.netlify.com/api/v1/badges/754fddcc-e010-4b27-913e-83c7b8ebdcf8/deploy-status)](https://app.netlify.com/sites/distracted-lamarr-c30618/deploys)

# Pennant

Pennant is a React component library for visualising financial data.

## Installing

```bash
yarn add pennant
```

## Documentation

```jsx
import React from "react";
import { Chart } from "pennant";

const dataSource = new ExampleDataSource();

export const App = () => {
  const [interval, setInterval] = React.useState("I1M");

  return <Chart dataSource={dataSource} interval={interval} onSetInterval={setInterval} />
}
```

## Contributing

### `yarn storybook`

Runs storybook.\
Open [http://localhost:6006](http://localhost:6006) to view it in the browser.

### `yarn test`

Launches the test runner in interactive watch mode.

### `yarn build`

Builds the library for production to the `dist` folder.

## Deploy Previews

https://pennant.netlify.app/

## License

Pennant is available under the [MIT license](https://opensource.org/licenses/MIT).
