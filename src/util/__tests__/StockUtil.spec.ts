import { fromAdvantageStockToStock } from "../StockUtil";
import stockJson from "../__fixture__/Stock.json";
import { some } from "fp-ts/lib/Option";

describe("StockUtil", () => {
  it("parses AlphaVantage data correctly", () => {
    const stock = JSON.stringify(stockJson);
    const parsed = fromAdvantageStockToStock(1)(stock);
    expect(parsed).toEqual(
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
        stockType: 1
      })
    );
  });
});
