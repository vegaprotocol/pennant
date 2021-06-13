import { useEffect, useState } from "react";

/**
 * Returns a boolean which starts off false and becomes true after a delay
 * @param delay - Delay in ms
 */
export const useDelayShow = (delay: number = 300) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return show;
};
