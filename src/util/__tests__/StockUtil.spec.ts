import { fromAdvantageStockToStock } from "../StockUtil";
import stockJson from "../__fixture__/Stock.json";
import { pipe } from "fp-ts/lib/pipeable";
import { toUndefined, some } from "fp-ts/lib/Option";

describe("StockUtil", () => {
  it("parses AlphaVantage data correctly", () => {
    expect(fromAdvantageStockToStock(JSON.stringify(stockJson))).toEqual(
      some({
        symbol: "RAIL3.SAO",
        open: 19.4,
        high: 20.0,
        low: 19.1,
        price: 19.17,
        volume: 7265000,
        latest: "2020-04-09",
        previous: 19.13,
        changeAbs: 0.04,
        changeP: 0.2091,
      })
    );
  });
});
