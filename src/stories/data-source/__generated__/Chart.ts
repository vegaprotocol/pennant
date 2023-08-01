import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";

import * as Types from "./types";

const defaultOptions = {} as const;
export type ChartQueryVariables = Types.Exact<{
  marketId: Types.Scalars["ID"];
}>;

export type ChartQuery = {
  __typename?: "Query";
  market?: {
    __typename?: "Market";
    decimalPlaces: number;
    positionDecimalPlaces: number;
    data?: {
      __typename?: "MarketData";
      priceMonitoringBounds?: Array<{
        __typename?: "PriceMonitoringBounds";
        minValidPrice: string;
        maxValidPrice: string;
        referencePrice: string;
      }> | null;
    } | null;
  } | null;
};

export const ChartDocument = gql`
  query Chart($marketId: ID!) {
    market(id: $marketId) {
      decimalPlaces
      positionDecimalPlaces
      data {
        priceMonitoringBounds {
          minValidPrice
          maxValidPrice
          referencePrice
        }
      }
    }
  }
`;

/**
 * __useChartQuery__
 *
 * To run a query within a React component, call `useChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useChartQuery({
 *   variables: {
 *      marketId: // value for 'marketId'
 *   },
 * });
 */
export function useChartQuery(
  baseOptions: Apollo.QueryHookOptions<ChartQuery, ChartQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ChartQuery, ChartQueryVariables>(
    ChartDocument,
    options,
  );
}
export function useChartLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<ChartQuery, ChartQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ChartQuery, ChartQueryVariables>(
    ChartDocument,
    options,
  );
}
export type ChartQueryHookResult = ReturnType<typeof useChartQuery>;
export type ChartLazyQueryHookResult = ReturnType<typeof useChartLazyQuery>;
export type ChartQueryResult = Apollo.QueryResult<
  ChartQuery,
  ChartQueryVariables
>;
