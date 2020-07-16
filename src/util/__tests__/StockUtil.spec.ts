import * as stockUtil from "../StockUtil";
import stockJson from "../__fixture__/Stock.json";
import { getRight, toUndefined, getLeft } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { isRight } from "fp-ts/lib/Either";
import got from "got";
import { hypera } from "../__fixture__/Stocks";
import { SAVE_STOCK } from "../Queries";

jest.mock("got");

describe("StockUtil", () => {
  afterEach(jest.clearAllMocks);

  describe("fromAdvantageStockToStock", () => {
    it("parses AlphaVantage data correctly", () => {
      const stock = JSON.stringify(stockJson);
      const parsed = stockUtil.fromAdvantageStockToStock(1)(stock);
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
      const parsed = stockUtil.fromAdvantageStockToStock(1)({ bla: 1 });
      expect(pipe(parsed, isRight)).toBeFalsy();
      expect(pipe(parsed, getLeft, toUndefined)).toEqual(
        new Error(
          `Error while parsing the Alpha Vantage result. SyntaxError: Unexpected token o in JSON at position 1`
        )
      );
    });
  });

  describe("findLastAlphaVantageBySymbol", () => {
    it("calls the correct alpha vantage URL with the correct params", () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        then: jest.fn(),
      });
      stockUtil.findLastAlphaVantageBySymbol(1)("a");
      expect(got).toHaveBeenCalledTimes(1);
      expect(
        got
      ).toHaveBeenCalledWith(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=a&dataType=json&apikey=${process.env.ALPHAVANTAGE_KEY}`,
        { retry: { calculateDelay: expect.any(Function), retries: 10 } }
      );
    });

    it("parses the alpha vantage returned success data", async () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(stockJson),
      });
      const response = await stockUtil.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getRight, toUndefined)).toEqual(
        pipe(
          stockUtil.fromAdvantageStockToStock(1)(JSON.stringify(stockJson)),
          getRight,
          toUndefined
        )
      );
    });

    it("parses the alpha vantage returned failed data", async () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify("{}"),
      });
      const response = await stockUtil.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getLeft, toUndefined)).toEqual(
        pipe(
          stockUtil.fromAdvantageStockToStock(1)(JSON.stringify("{}")),
          getLeft,
          toUndefined
        )
      );
    });

    it("handles alpha vantage service failure", async () => {
      const error = new Error("AlphaVantage is off");
      ((got as unknown) as jest.Mock).mockRejectedValue(error);
      const response = await stockUtil.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getLeft, toUndefined)).toEqual(error);
    });
  });

  describe("saveStock", () => {
    it("calls the correct Hasura URL with the correct params", () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(""),
      });
      stockUtil.saveStock(hypera);
      expect(got).toHaveBeenCalledTimes(1);
      expect(got).toHaveBeenCalledWith(
        `https://investments-graphql.herokuapp.com/v1/graphql`,
        {
          retry: {
            calculateDelay: expect.any(Function),
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
            variables: { ...hypera },
          }),
        }
      );
    });

    it("handles the hasura result", async () => {
      const response: stockUtil.HasuraStockSaveSuccessResponse = {
        data: { insert_Stock: { returning: [hypera], affected_rows: 1 } },
      };
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(response),
      });
      const result = await stockUtil.saveStock(hypera);
      expect(pipe(result, getRight, toUndefined)).toEqual(response);
    });

    it("handles hasura errors", async () => {
      const response: stockUtil.HasuraStockSaveErrorResponse = {
        errors: [{ extensions: [], message: "Error" }],
      };
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(response),
      });
      const result = await stockUtil.saveStock(hypera);
      expect(pipe(result, getRight, toUndefined)).toEqual(response);
    });

    it("handles hasura failures", async () => {
      const error = new Error("Ooops");
      ((got as unknown) as jest.Mock).mockRejectedValue(error);
      const result = await stockUtil.saveStock(hypera);
      expect(pipe(result, getLeft, toUndefined)).toEqual(error);
    });
  });
});
