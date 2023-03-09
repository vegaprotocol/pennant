export function identity(data: any[]) {
  return data;
}

export function indicatorAbsoluteChange() {
  let period = 2;
  let defined = (d: number) => d !== null;

  const absoluteChangeIndicator = function (data: number[]) {
    const windowData = data.slice(0, period);

    return data.map((d, i) => {
      if (i >= period) {
        windowData.shift();
        windowData.push(d);
      }

      if (i < period - 1 || windowData.some((d) => !defined(d))) {
        return NaN;
      }

      return windowData[windowData.length - 1] - windowData[0];
    });
  };

  absoluteChangeIndicator.period = (arg: number) => {
    period = arg;
    return absoluteChangeIndicator;
  };

  return absoluteChangeIndicator;
}

export function indicatorPercentageChange() {
  let period = 2;
  let defined = (d: number) => d !== null;

  const absoluteChangeIndicator = function (data: number[]) {
    const windowData = data.slice(0, period);

    return data.map((d, i) => {
      if (i >= period) {
        windowData.shift();
        windowData.push(d);
      }

      if (i < period - 1 || windowData.some((d) => !defined(d))) {
        return NaN;
      }

      return (
        (windowData[windowData.length - 1] - windowData[0]) / windowData[0]
      );
    });
  };

  absoluteChangeIndicator.period = (arg: number) => {
    period = arg;
    return absoluteChangeIndicator;
  };

  return absoluteChangeIndicator;
}
