import { Stock } from "../model/Stock";
import { prop, view, lens, compose, assoc } from "ramda";
import { some, Option, none, tryCatch } from "fp-ts/lib/Option";
import got, { Response } from "got";
import { pipe } from "fp-ts/lib/pipeable";
import { fold } from "fp-ts/lib/Option";
import { SAVE_STOCK } from "./Queries";

export const fromAdvantageStockToStock = (raw: any): Option<Stock> => {
  return tryCatch<Stock>(() => {
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
      changeP: Number(data[keys[9]].slice(0, data[keys[9]].length - 1))
    };
  });
};

export const requestBodyLens: <T>(response: Response<any>) => T = view(
  lens<Response<Stock>, Stock, Stock>(prop("body"), assoc("body"))
);

export const someStock = compose<Response<any>, any, Option<Stock>>(
  fromAdvantageStockToStock,
  requestBodyLens
);

export const findLastRemoteBySymbol = (
  ticker: string
): Promise<Option<Stock>> =>
  got(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&datatType=json&apikey=${process.env.ALPHAVANTAGE_KEY}`
  )
    .then(someStock)
    .catch(e => {
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
  volume
}: Stock): Promise<Stock> => {
  return got(`https://investments-graphql.herokuapp.com/v1/graphql`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      [process.env.HASURA_HEADER]: process.env.HASURA_KEY
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
        volume
      }
    })
  })
    .then(res => JSON.parse(res.body).data)
    .catch(e => {
      console.error(e);
    });
};

export const findAndSaveStock = (symbol: string) =>
  findLastRemoteBySymbol(symbol).then(optStock =>
    pipe(
      fold(
        () => console.error("Could not fetch the desired stock", symbol),
        (stock: Stock) => {
          saveStock(stock);
          console.info("Successfully saved: ", symbol);
        }
      )
    )(optStock)
  );
