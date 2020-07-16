import { fold } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { StockType } from "../model/StockType";
import {
  findLastAlphaVantageBySymbol,


  HasuraStockSaveErrorResponse, HasuraStockSaveSuccessResponse, ONE_MINUTE,


  saveStock
} from "../util/StockUtil";

const isHasuraSuccess = (
  data: HasuraStockSaveSuccessResponse | HasuraStockSaveErrorResponse
): data is HasuraStockSaveSuccessResponse =>
  !!Object.getOwnPropertyDescriptor(data, "data");

export const findAndSave = (stockType: number) => (symbol: string) =>
  findLastAlphaVantageBySymbol(stockType)(symbol).then((optStock) =>
    pipe(
      optStock,
      fold(
        (error) =>
          console.error(
            `Could not fetch the desired ${symbol} due to ${error}`
          ),
        (stock) => {
          saveStock(stock).then((result) => {
            pipe(
              result,
              fold(
                (error) => {
                  console.error(`Fatal error on Hasura save: ${error}`);
                },
                (hasuraData) => {
                  if (isHasuraSuccess(hasuraData)) {
                    console.info(
                      `Successfully saved on Hasura: ${symbol} - ${JSON.stringify(
                        hasuraData.data.insert_Stock
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

export const findAndSaveStock = findAndSave(StockType.Stock.valueOf());
export const findAndSaveFII = findAndSave(StockType.FII.valueOf());

export const syncStocks = () => {
  findAndSaveStock("HYPE3.SAO");
  // setTimeout(() => {
  //   findAndSaveStock("HYPE3.SAO");
  //   findAndSaveStock("RAIL3.SAO");
  //   findAndSaveStock("HBOR3.SAO");
  //   findAndSaveStock("EZTC3.SAO");
  //   findAndSaveStock("SAPR11.SAO");
  // }, 0);

  // setTimeout(() => {
  //   findAndSaveFII("RBRR11.SAO");
  //   findAndSaveFII("VISC11.SAO");
  //   findAndSaveFII("HGLG11.SAO");
  //   findAndSaveFII("HABT11.SAO");
  //   findAndSaveFII("HGRU11.SAO");
  // }, 2 * ONE_MINUTE);

  // setTimeout(() => {
  //   findAndSaveStock("ITSA4.SAO");
  //   findAndSaveStock("BOVA11.SAO");
  // }, 4 * ONE_MINUTE);
};
