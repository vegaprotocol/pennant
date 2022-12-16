---
id: faq
title: FAQ
---

Below are some of the most frequently asked questions on how to use Pennant.

### It's not working/I don't see anything

The chart components take their width and height from the element which contains them. They do not come with an explicit width or height out of the box. It's easy to end up with a div of height zero by accident. For example, adding a chart to a brand new Create React App project without setting a height on a containing div won't work because the default root div itself has no height.

You should also check that the css has been imported/included, for example at the root of your application:

```jsx
import "pennant/dist/style.css";
```

### Next.js

If you get an error when importing pennant in a Next.js project consider [not including the module server-side](https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr). Pennant currently only works in a browser. It might be possible to produce sensible results server-side in the future so create an issue requesting this if interested.
