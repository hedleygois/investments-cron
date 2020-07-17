import got from "got";
import * as util from "../../api/StockApi";
import stockJson from "../../api/__fixture__/Stock.json";
import * as service from "../StockService";
import { expectCt } from "helmet";

jest.mock("got");

describe("StockService", () => {
  afterEach(jest.clearAllMocks);

  describe("findAndSave", () => {
    it("finds the stock on AlphaVantage and save it", async () => {
      const spyFind = jest.spyOn(util, "findLastAlphaVantageBySymbol");
      const spySave = jest.spyOn(util, "saveStock");
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(stockJson),
      });
      await service.findAndSave(1)("a");
      expect(spyFind).toHaveBeenCalledTimes(1);
      expect(spySave).toHaveBeenCalledTimes(1);
      expect(spySave).toHaveBeenCalledWith({
        changeAbs: 0.04,
        changeP: 0.2091,
        high: 20,
        latest: "2020-04-09",
        low: 19.1,
        open: 19.4,
        previous: 19.13,
        price: 19.17,
        stockType: 1,
        symbol: "RAIL3",
        volume: 7265000,
      });
    });
  });

  describe("syncStocks", () => {
    it("calls the correct stocks", () => {
      ((got as unknown) as jest.Mock).mockResolvedValue({
        body: JSON.stringify(stockJson),
      });
      jest.useFakeTimers();
      const spyStock = jest.spyOn(service, "findAndSaveStock");
      const spyFII = jest.spyOn(service, "findAndSaveFII");
      service.syncStocks();
      jest.runAllTimers();
      expect(got).toHaveBeenCalledTimes(12);
      expect(spyStock).toHaveBeenCalledTimes(7);
      expect(spyFII).toHaveBeenCalledTimes(5);

      expect(spyStock).nthCalledWith(1, "HYPE3.SAO");
      expect(spyStock).nthCalledWith(2, "RAIL3.SAO");
      expect(spyStock).nthCalledWith(3, "HBOR3.SAO");
      expect(spyStock).nthCalledWith(4, "EZTC3.SAO");
      expect(spyStock).nthCalledWith(5, "SAPR11.SAO");
      expect(spyStock).nthCalledWith(6, "ITSA4.SAO");
      expect(spyStock).nthCalledWith(7, "BOVA11.SAO");

      expect(spyFII).nthCalledWith(1, "RBRR11.SAO");
      expect(spyFII).nthCalledWith(2, "VISC11.SAO");
      expect(spyFII).nthCalledWith(3, "HGLG11.SAO");
      expect(spyFII).nthCalledWith(4, "HABT11.SAO");
      expect(spyFII).nthCalledWith(5, "HGRU11.SAO");
    });
  });
});