---
id: depth-chart
title: DepthChart
---

# DepthChart API

## Props

| Name              | Type       | Default | Description                                                          |
| ----------------- | ---------- | ------- | -------------------------------------------------------------------- |
| `data`            | `object`   |         |                                                                      |
| `priceFormat`     | `function` |         | Used to format tick labels on price axis.                            |
| `indicativePrice` | `number`   |         | Indicative price if the auction ended now, 0 if not in auction mode. |
| `midPrice`        | `number`   |         | Arithmetic average of the best bid price and best offer price.       |
