export default function cumsum(values, valueof) {
  let fn = (v) => (sum += +valueof(v, index++, values) || 0);

  if (valueof === undefined) fn = (v) => (sum += +v || 0);

  var sum = 0,
    index = 0;

  return Float64Array.from(values, fn);
}
