import { useEffect, useState } from "react";

export const useDelayShow = (delay: number = 300) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return show;
};
