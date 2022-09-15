---
id: colors
title: Customizing Colors
---

import { ColorPalette } from '../src/components/color-palette';

## Default color palettte

Pennant includes a default color palette out-of-the-box that is a great starting point if you don’t have your own specific branding in mind.

<ColorPalette color="gray" />
<ColorPalette color="vega-green" />
<ColorPalette color="vega-red" />
<ColorPalette color="vega-blue" />
<ColorPalette color="vega-orange" />

## Using custom colors

You can override Pennant CSS variables globally. For example, this will override the dark grey used for primary text.

```css
:root {
  --pennant-color-gray-900: #1c1e21;
}
```

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
