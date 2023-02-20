import { useEffect, useState } from "react";

import { Configuration, DataSource } from "../../../types";

/**
 * Signal we're loading while we wait for onReady call to resolve.
 * Also returns the configuration data from the onReady call.
 */
export function useOnReady(dataSource: DataSource) {
  const [ready, setReady] = useState(true);
  const [configuration, setConfiguration] = useState<Configuration | null>(
    null
  );

  useEffect(() => {
    const onReady = async () => {
      setReady(true);
      const configuration = await dataSource.onReady();
      setConfiguration(configuration);
      setReady(false);
    };

    onReady();
  }, [dataSource]);

  return { ready, configuration };
}
