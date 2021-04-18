import gql from "graphql-tag";

export const orderFragments = {
  orders: gql`
    fragment OrderFields on Order {
      id
      price
      size
      updatedAt
      createdAt
      timeInForce
      side
      status
      party {
        id
      }
      reference
      remaining
      type
      market {
        id
        decimalPlaces
        tradableInstrument {
          instrument {
            id
            name
            code
          }
        }
      }
      peggedOrder {
        ... on PeggedOrder {
          offset
          reference
        }
      }
      expiresAt
      rejectionReason
      pending @client
      pendingAction @client
    }
  `,
  rejectedStatus: gql`
    fragment RejectedStatus on Order {
      status
      rejectionReason
      pending @client
      pendingAction @client
    }
  `,
  pending: gql`
    fragment Pending on Order {
      pending @client
      pendingAction @client
    }
  `,
};

export const orderQuery = gql`
  ${orderFragments.orders}
  query order($partyId: ID!) {
    party(id: $partyId) {
      id
      orders(last: 50) {
        ...OrderFields
      }
    }
  }
`;

export const orderSubscription = gql`
  ${orderFragments.orders}
  subscription orders($partyId: ID!) {
    orders(partyId: $partyId) {
      ...OrderFields
    }
  }
`;

export const prepareCancelOrderQuery = gql`
  mutation prepareOrderCancel($id: ID!, $marketId: ID!, $partyId: ID!) {
    prepareOrderCancel(id: $id, partyId: $partyId, marketId: $marketId) {
      blob
    }
  }
`;

export const prepareOrderSubmitQuery = gql`
  mutation prepareOrderSubmit(
    $marketId: ID!
    $partyId: ID!
    $price: String
    $size: String!
    $side: Side!
    $timeInForce: OrderTimeInForce!
    $expiration: String
    $type: OrderType!
    $reference: String!
  ) {
    prepareOrderSubmit(
      marketId: $marketId
      partyId: $partyId
      price: $price
      size: $size
      side: $side
      timeInForce: $timeInForce
      type: $type
      expiration: $expiration
      reference: $reference
    ) {
      blob
    }
  }
`;
