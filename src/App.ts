import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet"; // This library helps to secure Express APIs by defining various HTTP headers.
import http from "http";
import morgan from "morgan"; // This library adds some logging capabilities to your Express API.
import { findAndSaveStock } from "./util/StockUtil";

const app = express();
const port = 4000 || process.env.PORT;

const server = new http.Server(app);

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

const ONE_MINUTE = 60001;

console.info("Started....");

if (
  !process.env.HASURA_HEADER ||
  !process.env.HASURA_KEY ||
  !process.env.ALPHAVANTAGE_KEY
) {
  console.info("Please set your Hasura or AlphaVantage keys.");
}

server.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});

const router = express.Router();

router.get(
  "/:ticker",
  (req, res) => console.info("Intraday triggered")
  // findLastByTicker(req.params.ticker)(data => res.send(data))
);

app.use("/intraday", router);

setInterval(() => {
  // const hour = new Date().getUTCHours();
  // if (hour === 21) {

  setTimeout(() => {
    findAndSaveStock("TAEE11.SAO");
    findAndSaveStock("RAIL3.SAO");
    findAndSaveStock("HBOR3.SAO");
    findAndSaveStock("VVAR3.SAO");
    findAndSaveStock("BPAC11.SAO");
  }, 0);

  setTimeout(() => {
    findAndSaveStock("B3SA3.SAO");
    findAndSaveStock("RBRR11.SAO");
    findAndSaveStock("VISC11.SAO");
    findAndSaveStock("HGLG11.SAO");
    findAndSaveStock("BBPO11.SAO");
  }, 2 * ONE_MINUTE);

  setTimeout(() => {
    findAndSaveStock("HGRU11.SAO");
  }, 4 * ONE_MINUTE);
}, 10 * ONE_MINUTE);
