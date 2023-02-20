---
id: depth-chart
title: DepthChart
---

# DepthChart API

## Props

| Name                | Type              | Default   | Description                                                          |
| ------------------- | ----------------- | --------- | -------------------------------------------------------------------- |
| `data`              | `object`          |           |                                                                      |
| `priceFormat`       | `function`        |           | Used to format values on price axis.                                 |
| `volumeFormat`      | `function`        |           | Used to format values on volume axis.                                |
| `indicativePrice`   | `number`          |           | Indicative price if the auction ended now, 0 if not in auction mode. |
| `midPrice`          | `number`          |           | Arithmetic average of the best bid price and best offer price.       |
| `notEnoughDataText` | `ReactNode`       | `No data` | Override the default text to display when there is not enough data.  |
| `theme`             | `dark` \| `light` | `dark`    |                                                                      |
