export const QUERY_BY_TICKER = `
  query ByTicker($symbol: String!) {
    Stock(where: { symbol: { _eq: $symbol } }) {
      id
      symbol
      price
      open
      high
      low
      previous
      latest
      changeAbs
      changeP
    }
  }
`;

export const SAVE_STOCK = `
  mutation SaveStock($symbol: String!, $open: float8, $price: float8!, $high: float8, $low: float8, $volume: float8, $latest: timestamptz, $previous: float8, $changeAbs: float8, $changeP: float8) {
    insert_Stock(objects: {symbol: $symbol, open: $open, price: $price, high: $high, low: $low, volume: $volume, latest: $latest, previous: $previous, changeAbs: $changeAbs, changeP: $changeP}) {
      affected_rows,
      returning {
        id
      }
    }
  }
`;