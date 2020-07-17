import { fromAdvantageStockToStock } from "../StockUtil";
import { pipe } from "fp-ts/lib/pipeable";
import { isRight } from "fp-ts/lib/Either";
import { getRight, toUndefined, getLeft } from "fp-ts/lib/Option";

import stockJson from "../../api/__fixture__/Stock.json";

describe("StockUtil", () => {
  describe("fromAdvantageStockToStock", () => {
    it("parses AlphaVantage data correctly", () => {
      const stock = JSON.stringify(stockJson);
      const parsed = fromAdvantageStockToStock(1)(stock);
      expect(pipe(parsed, isRight)).toBeTruthy();
      expect(pipe(parsed, getRight, toUndefined)).toEqual({
        symbol: "RAIL3",
        open: 19.4,
        high: 20.0,
        low: 19.1,
        price: 19.17,
        volume: 7265000,
        latest: "2020-04-09",
        previous: 19.13,
        changeAbs: 0.04,
        changeP: 0.2091,
        stockType: 1,
      });
    });

    it("handles AlphaVantage parsing errors", () => {
      const parsed = fromAdvantageStockToStock(1)({ bla: 1 });
      expect(pipe(parsed, isRight)).toBeFalsy();
      expect(pipe(parsed, getLeft, toUndefined)).toEqual(
        new Error(
          `Error while parsing the Alpha Vantage result. SyntaxError: Unexpected token o in JSON at position 1`
        )
      );
    });
  });
});
