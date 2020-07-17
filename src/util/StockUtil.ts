import { Either, tryCatch } from "fp-ts/lib/Either";
import { Stock } from "../model/Stock";

export const fromAdvantageStockToStock = (stockType: number) => (
  raw: any
): Either<Error, Stock> =>
  tryCatch(
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
