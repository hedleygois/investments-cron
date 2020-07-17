import { Stock } from "../../model/Stock";
import { StockType } from "../../model/StockType";

// use test-data-bot or fast-check here in the future 
export const hypera: Stock = {
  price: 1,
  changeAbs: 1,
  changeP: 0.1,
  high: 1,
  latest: "2020-03-01",
  low: 1,
  open: 1,
  previous: 1,
  stockType: StockType.Stock,
  symbol: "HYPE3",
  volume: 1
}