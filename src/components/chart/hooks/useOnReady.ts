import { useEffect, useState } from "react";

import { Configuration, DataSource } from "../../../types";

/**
 * Signal we're loading while we wait for onReady call to resolve.
 * Also returns the configuration data from the onReady call.
 */
export function useOnReady(dataSource: DataSource) {
  const [loading, setLoading] = useState(true);
  const [configuration, setConfiguration] = useState<Configuration | null>(
    null
  );

  useEffect(() => {
    const onReady = async () => {
      setLoading(true);
      const configuration = await dataSource.onReady();
      setConfiguration(configuration);
      setLoading(false);
    };

    onReady();
  }, [dataSource]);

  return { loading, configuration };
}
