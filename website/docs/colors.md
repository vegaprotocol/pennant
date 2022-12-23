---
id: colors
title: Customizing Colors
---

import { ColorPalette } from '../src/components/color-palette';

## Default color palettte

Pennant includes a default color palette out-of-the-box that is a great starting point if you don’t have your own specific branding in mind.

<div style={{display: "grid", gap: "2rem"}}>
  <ColorPalette color="gray" />
  <ColorPalette color="vega-green" />
  <ColorPalette color="vega-red" />
  <ColorPalette color="vega-blue" />
  <ColorPalette color="vega-orange" />
</div>

## Using custom colors

You can override Pennant CSS variables globally. For example, this will override the dark grey used for primary text.

```css
:root {
  --pennant-color-gray-900: #1c1e21;
}
```

For an up-to-date list of CSS variables check out `pennant/dist/style.css`.

You must remember to set the dark mode variables explicitly too, e.g.

```css
[data-theme="dark"] .container {
  --pennant-color-buy-fill: #00ff00;
}
```

The most important variables are highlighted below:

### Candlestick chart

| Chart element      | CSS Variable                  |
| ------------------ | ----------------------------- |
| Up candle fill     | `--pennant-color-buy-fill`    |
| Up candle stroke   | `--pennant-color-buy-stroke`  |
| Down candle fill   | `--pennant-color-sell-fill`   |
| Down candle stroke | `--pennant-color-sell-stroke` |

### Depth chart

| Chart element    | CSS Variable                        |
| ---------------- | ----------------------------------- |
| Buy side fill    | `--pennant-color-depth-buy-fill`    |
| Buy side stroke  | `--pennant-color-depth-buy-stroke`  |
| Sell side fill   | `--pennant-color-depth-sell-fill`   |
| Sell side stroke | `--pennant-color-depth-sell-stroke` |

### Price chart

| Chart element              | CSS Variable                            |
| -------------------------- | --------------------------------------- |
| Positive difference fill   | `--pennant-color-price-positive-fill`   |
| Positive difference stroke | `--pennant-color-price-positive-stroke` |
| Negative difference fill   | `--pennant-color-price-negative-fill`   |
| Negative difference stroke | `--pennant-color-price-negative-stroke` |

## Which colors are used where?

It is not always obvious which colors are used by particular chart elements. The following gives some of the more important examples:

### Candlestick chart

| Chart element      | CSS Variable                     | Dark mode                        |
| ------------------ | -------------------------------- | -------------------------------- |
| Up candle fill     | `--pennant-color-vega-green-50`  | `--pennant-color-vega-green-900` |
| Up candle stroke   | `--pennant-color-vega-green-500` | `--pennant-color-vega-green-500` |
| Down candle fill   | `--pennant-color-vega-red-50`    | `--pennant-color-vega-red-900`   |
| Down candle stroke | `--pennant-color-vega-red-500`   | `--pennant-color-vega-red-500`   |
| Grid lines         | `--pennant-color-gray-100`       | `--pennant-color-gray-900`       |

### Depth chart

| Chart element    | CSS Variable                     | Dark mode                        |
| ---------------- | -------------------------------- | -------------------------------- |
| Buy side fill    | `--pennant-color-vega-green-50`  | `--pennant-color-vega-green-900` |
| Buy side stroke  | `--pennant-color-vega-green-500` | `--pennant-color-vega-green-500` |
| Sell side fill   | `--pennant-color-vega-red-50`    | `--pennant-color-vega-red-900`   |
| Sell side stroke | `--pennant-color-vega-red-500`   | `--pennant-color-vega-red-500`   |
