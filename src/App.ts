import { findAndSaveStock } from "./util/StockUtil";

const ONE_MINUTE = 60001;

console.info("Started....");

if (!process.env.HASURA_HEADER || !process.env.HASURA_KEY || !process.env.ALPHAVANTAGE_KEY) {
  console.info("Please set your Hasura or AlphaVantage keys.");
}

setInterval(() => {
  try {
    setTimeout(() => {
      findAndSaveStock("TAEE11.SAO");
      // findAndSaveStock("RAIL3.SAO");
      // findAndSaveStock("HBOR3.SAO");
      // findAndSaveStock("VVAR3.SAO");
      // findAndSaveStock("BPAC11.SAO");
    }, 0);

  } catch (e) {
    console.error(e)
  }
  // const hour = new Date().getUTCHours();
  // if (hour === 21) {

    // setTimeout(() => {
    //   findAndSaveStock("B3SA3.SAO");
    //   findAndSaveStock("RBRR11.SAO");
    //   findAndSaveStock("VISC11.SAO");
    //   findAndSaveStock("HGLG11.SAO");
    //   findAndSaveStock("BBPO11.SAO");
    // }, 2 * ONE_MINUTE);

    // setTimeout(() => {
    //   findAndSaveStock("HGRU11.SAO");
    // }, 4 * ONE_MINUTE);
  // }
}, ONE_MINUTE);