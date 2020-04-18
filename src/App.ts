import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet"; // This library helps to secure Express APIs by defining various HTTP headers.
import http from "http";
import morgan from "morgan"; // This library adds some logging capabilities to your Express API.
import { syncStocks, ONE_HOUR } from "./util/StockUtil";

const app = express();
const port = 10050;

const server = new http.Server(app);

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

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
  console.log(`server started...`);
});

const router = express.Router();

router.get(
  "/sync",
  (_, res) => {
    console.info("Intraday triggered");
    syncStocks();
    res.send("Intraday values will shortly be in sync...");
  }
);

app.use("/intraday", router);

setInterval(() => {
  // fetch intraday in the future
  const hour = new Date().getUTCHours();
  if (hour === 23) {
   syncStocks();
  }
}, ONE_HOUR);
