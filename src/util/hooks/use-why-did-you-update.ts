import { useEffect, useRef } from "react";

export function useWhyDidYouUpdate(
  name: string,
  props: { [index: string]: any },
) {
  const previousProps = useRef<{ [index: string]: any }>({});

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj = {} as { [index: string]: any };

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log("[why-did-you-update]", name, changesObj);
      }
    }

    previousProps.current = props;
  });
}
