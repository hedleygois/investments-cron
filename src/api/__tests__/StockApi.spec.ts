import { getLeft, getRight, toUndefined } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import got from "got";
import { SAVE_STOCK } from "../Queries";
import * as stockApi from "../StockApi";
import stockJson from "../__fixture__/Stock.json";
import { hypera } from "../__fixture__/Stocks";
import { fromAdvantageStockToStock } from "../../util/StockUtil";

jest.mock("got");

describe("StockApi", () => {
  afterEach(jest.clearAllMocks);

  describe("findLastAlphaVantageBySymbol", () => {
    it("calls the correct alpha vantage URL with the correct params", () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        then: jest.fn(),
      });
      stockApi.findLastAlphaVantageBySymbol(1)("a");
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
      const response = await stockApi.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getRight, toUndefined)).toEqual(
        pipe(
          fromAdvantageStockToStock(1)(JSON.stringify(stockJson)),
          getRight,
          toUndefined
        )
      );
    });

    it("parses the alpha vantage returned failed data", async () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify("{}"),
      });
      const response = await stockApi.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getLeft, toUndefined)).toEqual(
        pipe(
          fromAdvantageStockToStock(1)(JSON.stringify("{}")),
          getLeft,
          toUndefined
        )
      );
    });

    it("handles alpha vantage service failure", async () => {
      const error = new Error("AlphaVantage is off");
      ((got as unknown) as jest.Mock).mockRejectedValue(error);
      const response = await stockApi.findLastAlphaVantageBySymbol(1)("a");
      expect(pipe(response, getLeft, toUndefined)).toEqual(error);
    });
  });

  describe("saveStock", () => {
    it("calls the correct Hasura URL with the correct params", () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(""),
      });
      stockApi.saveStock(hypera);
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
      const response: stockApi.HasuraStockSaveSuccessResponse = {
        data: { insert_Stock: { returning: [hypera], affected_rows: 1 } },
      };
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(response),
      });
      const result = await stockApi.saveStock(hypera);
      expect(pipe(result, getRight, toUndefined)).toEqual(response);
    });

    it("handles hasura errors", async () => {
      const response: stockApi.HasuraStockSaveErrorResponse = {
        errors: [{ extensions: [], message: "Error" }],
      };
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(response),
      });
      const result = await stockApi.saveStock(hypera);
      expect(pipe(result, getRight, toUndefined)).toEqual(response);
    });

    it("handles hasura failures", async () => {
      const error = new Error("Ooops");
      ((got as unknown) as jest.Mock).mockRejectedValue(error);
      const result = await stockApi.saveStock(hypera);
      expect(pipe(result, getLeft, toUndefined)).toEqual(error);
    });
  });
});
