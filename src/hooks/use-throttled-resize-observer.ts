import { throttle } from "lodash";
import { useMemo, useState } from "react";
import useResizeObserver from "use-resize-observer";

type ObservedSize = {
  width: number | undefined;
  height: number | undefined;
};

export function useThrottledResizeObserver<T extends HTMLElement>(
  wait: number
) {
  const [size, setSize] = useState<ObservedSize>({
    width: undefined,
    height: undefined,
  });

  const onResize = useMemo(() => throttle(setSize, wait), [wait]);

  const { ref } = useResizeObserver<T>({ onResize });

  return { ref, ...size };
}
