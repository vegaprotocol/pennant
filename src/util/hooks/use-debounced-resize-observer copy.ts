import { debounce } from "lodash";
import { useMemo, useState } from "react";

import useResizeObserver, { ObservedSize } from "./use-resize-observer";

export function useDebouncedResizeObserver<T extends HTMLElement>(
  wait: number,
) {
  const [size, setSize] = useState<ObservedSize>({
    width: undefined,
    height: undefined,
    devicePixelContentBoxSizeInlineSize: undefined,
    devicePixelContentBoxSizeBlockSize: undefined,
  });

  const onResize = useMemo(
    () => debounce(setSize, wait, { leading: true }),
    [wait],
  );

  const { ref } = useResizeObserver<T>({ onResize });

  return { ref, ...size };
}
