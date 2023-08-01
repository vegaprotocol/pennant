import { throttle } from "lodash";
import { useMemo, useState } from "react";

import useResizeObserver, { ObservedSize } from "./use-resize-observer";

export function useThrottledResizeObserver<T extends HTMLElement>(
  wait: number,
) {
  const [size, setSize] = useState<ObservedSize>({
    width: undefined,
    height: undefined,
    devicePixelContentBoxSizeInlineSize: undefined,
    devicePixelContentBoxSizeBlockSize: undefined,
  });

  const onResize = useMemo(() => throttle(setSize, wait), [wait]);

  const { ref } = useResizeObserver<T>({ onResize });

  return { ref, ...size };
}
