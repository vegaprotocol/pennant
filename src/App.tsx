import * as React from "react";

import { ApolloDataSource } from "./data/apollo-data-source";
import { Chart } from "./components/chart";
import { useApolloClient } from "@apollo/client";

function App() {
  const client = useApolloClient();
  const dataSource = React.useMemo(
    () => new ApolloDataSource(client, "5A86B190C384997F"),
    [client]
  );

  return (
    <div style={{ padding: "8px" }}>
      <h1>Console Charts</h1>
      <Chart dataSource={dataSource} />
    </div>
  );
}

export default App;
