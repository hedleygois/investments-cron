import {
  Either,
  left, tryCatch as tryCatchE
} from "fp-ts/lib/Either";
import got from "got";
import { Stock } from "../model/Stock";
import { SAVE_STOCK } from "./Queries";

export const ONE_MINUTE = 60001;
export const ONE_HOUR = 60 * ONE_MINUTE;

export const fromAdvantageStockToStock = (stockType: number) => (
  raw: any
): Either<Error, Stock> =>
  tryCatchE(
    () => {
      const parsed = JSON.parse(raw);
      const data = parsed["Global Quote"];
      const keys = Object.keys(data);
      return {
        symbol: data[keys[0]].split(".")[0],
        open: Number(data[keys[1]]),
        high: Number(data[keys[2]]),
        low: Number(data[keys[3]]),
        price: Number(data[keys[4]]),
        volume: Number(data[keys[5]]),
        latest: data[keys[6]],
        previous: Number(data[keys[7]]),
        changeAbs: Number(data[keys[8]]),
        changeP: Number(data[keys[9]].slice(0, data[keys[9]].length - 1)),
        stockType,
      };
    },
    (error: unknown) =>
      new Error(`Error while parsing the Alpha Vantage result. ${error}`)
  );

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
