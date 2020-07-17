import { Either, left, tryCatch as tryCatchE } from "fp-ts/lib/Either";
import got from "got";
import { Stock } from "../model/Stock";
import { SAVE_STOCK } from "./Queries";
import { fromAdvantageStockToStock } from "../util/StockUtil";

export const ONE_MINUTE = 60001;
export const ONE_HOUR = 60 * ONE_MINUTE;

export const findLastAlphaVantageBySymbol = (stockType: number) => (
  symbol: string
): Promise<Either<Error, Stock>> =>
  got(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&dataType=json&apikey=${process.env.ALPHAVANTAGE_KEY}`,
    {
      retry: {
        calculateDelay: (retryParams) => retryParams.attemptCount * 60000,
        retries: 10,
      },
    }
  )
    .then((value) => fromAdvantageStockToStock(stockType)(value.body))
    .catch((e: Error) => left<Error, Stock>(e));

export type HasuraStockSaveSuccessResponse = {
  data: {
    insert_Stock: {
      affected_rows: number;
      returning: Stock[];
    };
  };
};

type HasuraErrorExtensions = {
  path: string;
  code: string;
};

type HasuraError = {
  extensions: HasuraErrorExtensions[];
  message: string;
};

export type HasuraStockSaveErrorResponse = {
  errors: HasuraError[];
};

export const saveStock = (
  stock: Stock
): Promise<
  Either<Error, HasuraStockSaveSuccessResponse | HasuraStockSaveErrorResponse>
> => {
  return got(`https://investments-graphql.herokuapp.com/v1/graphql`, {
    retry: {
      calculateDelay: (retryParams) => retryParams.attemptCount * 60000,
      retries: 10,
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      [process.env.HASURA_HEADER]: process.env.HASURA_KEY,
    },
    method: "POST",
    body: JSON.stringify({
      query: SAVE_STOCK,
      variables: {
        ...stock,
      },
    }),
  })
    .then((res) =>
      tryCatchE(
        () =>
          JSON.parse(res.body) as
            | HasuraStockSaveSuccessResponse
            | HasuraStockSaveErrorResponse,
        (error: Error) => error // identity breaks here because the unknown is not Error
      )
    )
    .catch(left);
};
