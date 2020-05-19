import { Stock } from "../model/Stock";
import { Option, none, tryCatch, fold as foldO } from "fp-ts/lib/Option";
import {
  tryCatch as tryCatchE,
  Either,
  left,
  fold as foldE,
} from "fp-ts/lib/Either";
import got from "got";
import { pipe } from "fp-ts/lib/pipeable";
import { SAVE_STOCK } from "./Queries";
import { StockType } from "../model/StockType";

export const ONE_MINUTE = 60001;
export const ONE_HOUR = 60 * ONE_MINUTE;

export const fromAdvantageStockToStock = (stockType: number) => (raw: any): Option<Stock> =>
  tryCatch<Stock>(() => {
    const parsed = JSON.parse(raw);
    const data = parsed["Global Quote"];
    const keys = Object.keys(data);
    return {
      symbol: data[keys[0]],
      open: Number(data[keys[1]]),
      high: Number(data[keys[2]]),
      low: Number(data[keys[3]]),
      price: Number(data[keys[4]]),
      volume: Number(data[keys[5]]),
      latest: data[keys[6]],
      previous: Number(data[keys[7]]),
      changeAbs: Number(data[keys[8]]),
      changeP: Number(data[keys[9]].slice(0, data[keys[9]].length - 1)),
      stockType
    };
  });

export const findLastAlphaVantageBySymbol = (stockType: number) => (
  symbol: string
): Promise<Option<Stock>> =>
  got(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&datatType=json&apikey=${process.env.ALPHAVANTAGE_KEY}`,
    {
      retry: {
        calculateDelay: (retryParams) => retryParams.attemptCount * 60000,
        retries: 10,
      },
    }
  )
    .then((value) => fromAdvantageStockToStock(stockType)(value))
    .catch((e) => {
      console.error(e);
      return none;
    });

const saveStock = ({
  symbol,
  price,
  open,
  high,
  low,
  previous,
  latest,
  changeAbs,
  changeP,
  volume,
}: Stock): Promise<Either<Error, any>> => {
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
        symbol,
        price,
        open,
        high,
        low,
        previous,
        latest,
        changeAbs,
        changeP,
        volume,
        active: true
      },
    }),
  })
    .then((res) =>
      tryCatchE(
        () => JSON.parse(res.body),
        (error: Error) => {
          return error;
        }
      )
    )
    .catch(left);
};


export const findAndSave = (stockType: number) => (symbol: string) =>
  findLastAlphaVantageBySymbol(stockType)(symbol).then((optStock) =>
    pipe(
      optStock,
      foldO(
        () => console.error("Could not fetch the desired stock", symbol),
        (stock: Stock) => {
          saveStock(stock).then((result) => {
            pipe(
              result,
              foldE(
                (error) => {
                  console.error(`Fatal error on Hasura save: ${error}`);
                },
                (hasuraData) => {
                  if (hasuraData.data) {
                    console.info(
                      `Successfully saved on Hasura: ${symbol} - ${JSON.stringify(
                        hasuraData.data["insert_Stock"]
                      )}`
                    );
                  } else {
                    console.error(
                      `Failed to save on Hasura: ${JSON.stringify(
                        hasuraData.errors
                      )}`
                    );
                  }
                }
              )
            );
          });
        }
      )
    )
  );

const findAndSaveStock = findAndSave(StockType.Stock.valueOf());
const findAndSaveFII = findAndSave(StockType.FII.valueOf());

export const syncStocks = () => {
  setTimeout(() => {
    findAndSaveStock("HYPE3.SAO");
    findAndSaveStock("RAIL3.SAO");
    findAndSaveStock("HBOR3.SAO");
    findAndSaveStock("VVAR3.SAO");
    findAndSaveStock("EZTC3.SAO");
  }, 0);

  setTimeout(() => {
    findAndSaveFII("RBRR11.SAO");
    findAndSaveFII("VISC11.SAO");
    findAndSaveFII("HGLG11.SAO");
    findAndSaveFII("HABT11.SAO");
  }, 2 * ONE_MINUTE);

  setTimeout(() => {
    findAndSaveFII("HGRU11.SAO");
    findAndSaveStock("ITSA4.SAO");
    findAndSaveStock("BOVA11.SAO");
  }, 4 * ONE_MINUTE);
};
