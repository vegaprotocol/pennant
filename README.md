[![GitHub license](https://img.shields.io/npm/l/pennant?style=plastic)](https://github.com/vegaprotocol/pennant/blob/main/LICENSE)
[![CI status](https://github.com/vegaprotocol/pennant/actions/workflows/test.yml/badge.svg)](https://github.com/vegaprotocol/pennant/actions/workflows/test.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/754fddcc-e010-4b27-913e-83c7b8ebdcf8/deploy-status)](https://app.netlify.com/sites/distracted-lamarr-c30618/deploys)

<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://user-images.githubusercontent.com/981531/111454723-e0742f00-870c-11eb-8030-49edb8f05bc3.png" alt="Logo" width="256" height="128" style="image-rendering: pixelated;">
  </a>

  <h3 align="center">Pennant</h3>

  <p align="center">
    A React component library for visualising financial data.
    <br />
    <br />
    <a href="https://pennant.netlify.app/">View Demo</a>
    ·
    <a href="https://github.com/vegaprotocol/pennant/issues">Report Bug</a>
    ·
    <a href="https://github.com/vegaprotocol/pennant/issues">Request Feature</a>
  </p>
</p>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Usage</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

React components for viewing financial data. Built for the Vega platform.

## Getting Started

Pennant is available from npm.

### Prerequisites

Pennant has `react` and `react-dom` as peer dependencies.

```sh
yarn add react react-dom
```

### Installation

```sh
yarn add pennant
```

## Usage

```jsx
import React from "react";
import { Chart } from "pennant";

const dataSource = new ExampleDataSource();

export const App = () => {
  const [interval, setInterval] = React.useState("I1M");

  return (
    <Chart
      dataSource={dataSource}
      interval={interval}
      onSetInterval={setInterval}
    />
  );
};
```

## Contributing

### Development

We use [Storybook](https://storybook.js.org/).

```sh
yarn storybook
```

Open [http://localhost:6006](http://localhost:6006) to view in the browser.

### Building

To build the library run

```sh
yarn build
```

The output can be found in the `dist` directory.

### Testing

To run the tests

```sh
yarn test
```

## License

Pennant is available under the [MIT license](https://opensource.org/licenses/MIT).
