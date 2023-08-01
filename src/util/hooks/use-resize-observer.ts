/* eslint-disable react-hooks/exhaustive-deps */
/*
  Based on https://github.com/ZeeCoder/use-resize-observer
*/
import {
  RefCallback,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function hasDevicePixelContentBox() {
  return new Promise((resolve) => {
    const ro: ResizeObserver = new ResizeObserver((entries) => {
      resolve(entries.every((entry) => "devicePixelContentBoxSize" in entry));
      ro.disconnect();
    });

    ro.observe(document.body, { box: ["device-pixel-content-box"] } as any);
  }).catch(() => false);
}

let supportDevicePixelContentBox = false;

hasDevicePixelContentBox().then((result) => {
  if (result) {
    supportDevicePixelContentBox = true;
  }
});

type SubscriberCleanup = () => void;
type SubscriberResponse = SubscriberCleanup | void;

// This of course could've been more streamlined with internal state instead of
// refs, but then host hooks / components could not opt out of renders.
// This could've been exported to its own module, but the current build doesn't
// seem to work with module imports and I had no more time to spend on this...
function useResolvedElement<T extends HTMLElement>(
  subscriber: (element: T) => SubscriberResponse,
  refOrElement?: T | RefObject<T> | null,
): RefCallback<T> {
  const callbackRefElement = useRef<T | null>(null);
  const refCallback = useCallback<RefCallback<T>>((element) => {
    callbackRefElement.current = element;
    callSubscriber();
  }, []);
  const lastReportedElementRef = useRef<T | null>(null);
  const cleanupRef = useRef<SubscriberResponse | null>();

  const callSubscriber = () => {
    let element = null;
    if (callbackRefElement.current) {
      element = callbackRefElement.current;
    } else if (refOrElement) {
      if (refOrElement instanceof HTMLElement) {
        element = refOrElement;
      } else {
        element = refOrElement.current;
      }
    }

    if (lastReportedElementRef.current === element) {
      return;
    }

    if (cleanupRef.current) {
      cleanupRef.current();
      // Making sure the cleanup is not called accidentally multiple times.
      cleanupRef.current = null;
    }
    lastReportedElementRef.current = element;

    // Only calling the subscriber, if there's an actual element to report.
    if (element) {
      cleanupRef.current = subscriber(element);
    }
  };

  // On each render, we check whether a ref changed, or if we got a new raw
  // element.
  useEffect(() => {
    // Note that this does not mean that "element" will necessarily be whatever
    // the ref currently holds. It'll simply "update" `element` each render to
    // the current ref value, but there's no guarantee that the ref value will
    // not change later without a render.
    // This may or may not be a problem depending on the specific use case.
    callSubscriber();
  }, [refOrElement]);

  return refCallback;
}

export type ObservedSize = {
  width: number | undefined;
  height: number | undefined;
  devicePixelContentBoxSizeInlineSize: number | undefined;
  devicePixelContentBoxSizeBlockSize: number | undefined;
};

type ResizeHandler = (size: ObservedSize) => void;

type HookResponse<T extends HTMLElement> = {
  ref: RefCallback<T>;
} & ObservedSize;

function useResizeObserver<T extends HTMLElement>(
  opts: {
    ref?: RefObject<T> | T | null | undefined;
    onResize?: ResizeHandler;
  } = {},
): HookResponse<T> {
  // Saving the callback as a ref. With this, I don't need to put onResize in the
  // effect dep array, and just passing in an anonymous function without memoising
  // will not reinstantiate the hook's ResizeObserver
  const onResize = opts.onResize;
  const onResizeRef = useRef<ResizeHandler | undefined>(undefined);
  onResizeRef.current = onResize;

  // Using a single instance throughout the hook's lifetime
  const resizeObserverRef = useRef<ResizeObserver>();

  const [size, setSize] = useState<{
    width?: number;
    height?: number;
    devicePixelContentBoxSizeInlineSize?: number;
    devicePixelContentBoxSizeBlockSize?: number;
  }>({
    width: undefined,
    height: undefined,
    devicePixelContentBoxSizeInlineSize: undefined,
    devicePixelContentBoxSizeBlockSize: undefined,
  });

  // In certain edge cases the RO might want to report a size change just after
  // the component unmounted.
  const didUnmount = useRef(false);
  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  // Using a ref to track the previous width / height to avoid unnecessary renders
  const previous: {
    current: {
      width?: number;
      height?: number;
      devicePixelContentBoxSizeInlineSize?: number;
      devicePixelContentBoxSizeBlockSize?: number;
    };
  } = useRef({
    width: undefined,
    height: undefined,
    devicePixelContentBoxSizeInlineSize: undefined,
    devicePixelContentBoxSizeBlockSize: undefined,
  });

  // This block is kinda like a useEffect, only it's called whenever a new
  // element could be resolved based on the ref option. It also has a cleanup
  // function.
  const refCallback = useResolvedElement<T>((element) => {
    // Initialising the RO instance
    if (!resizeObserverRef.current) {
      // Saving a single instance, used by the hook from this point on.
      resizeObserverRef.current = new ResizeObserver((entries) => {
        if (!Array.isArray(entries)) {
          return;
        }

        const entry = entries[0];

        if (entry) {
          // `Math.round` is in line with how CSS resolves sub-pixel values
          const newWidth = Math.round(entry.contentRect.width);
          const newHeight = Math.round(entry.contentRect.height);

          const newDevicePixelContentBoxSizeInlineSize =
            entry.devicePixelContentBoxSize?.[0].inlineSize;

          const newDevicePixelContentBoxSizeBlockSize =
            entry.devicePixelContentBoxSize?.[0].blockSize;

          if (
            previous.current.width !== newWidth ||
            previous.current.height !== newHeight ||
            previous.current.devicePixelContentBoxSizeInlineSize !==
              newDevicePixelContentBoxSizeInlineSize ||
            previous.current.devicePixelContentBoxSizeBlockSize !==
              newDevicePixelContentBoxSizeBlockSize
          ) {
            const newSize = {
              width: newWidth,
              height: newHeight,
              devicePixelContentBoxSizeInlineSize:
                newDevicePixelContentBoxSizeInlineSize,
              devicePixelContentBoxSizeBlockSize:
                newDevicePixelContentBoxSizeBlockSize,
            };
            if (onResizeRef.current) {
              onResizeRef.current(newSize);
            } else {
              previous.current.width = newWidth;
              previous.current.height = newHeight;
              previous.current.devicePixelContentBoxSizeInlineSize =
                newDevicePixelContentBoxSizeInlineSize;
              previous.current.devicePixelContentBoxSizeBlockSize =
                newDevicePixelContentBoxSizeBlockSize;
              if (!didUnmount.current) {
                setSize(newSize);
              }
            }
          }
        }
      });
    }

    resizeObserverRef.current.observe(
      element,
      supportDevicePixelContentBox
        ? {
            box: "device-pixel-content-box",
          }
        : {},
    );

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.unobserve(element);
      }
    };
  }, opts.ref);

  return useMemo(
    () => ({
      ref: refCallback,
      width: size.width,
      height: size.height,
      devicePixelContentBoxSizeInlineSize:
        size.devicePixelContentBoxSizeInlineSize,
      devicePixelContentBoxSizeBlockSize:
        size.devicePixelContentBoxSizeBlockSize,
    }),
    [
      refCallback,
      size ? size.width : null,
      size ? size.height : null,
      size ? size.devicePixelContentBoxSizeInlineSize : null,
      size ? size.devicePixelContentBoxSizeBlockSize : null,
    ],
  );
}

export default useResizeObserver;
