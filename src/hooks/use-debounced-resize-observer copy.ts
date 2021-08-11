import { debounce } from "lodash";
import { useMemo, useState } from "react";
import useResizeObserver from "use-resize-observer";

type ObservedSize = {
  width: number | undefined;
  height: number | undefined;
};

export function useDebouncedResizeObserver<T extends HTMLElement>(
  wait: number
) {
  const [size, setSize] = useState<ObservedSize>({
    width: undefined,
    height: undefined,
  });

  const onResize = useMemo(
    () => debounce(setSize, wait, { leading: true }),
    [wait]
  );

  const { ref } = useResizeObserver<T>({ onResize });

  return { ref, ...size };
}
