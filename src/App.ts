import bodyParser from "body-parser";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { syncStocks } from "./service/StockService";

const app = express();
const port = process.env.PORT || 4000;

const server = new http.Server(app);

app.use(helmet());
app.use(bodyParser.json());
app.use(morgan("combined"));

console.info("Started....");

if (
  !process.env.HASURA_HEADER ||
  !process.env.HASURA_KEY ||
  !process.env.ALPHAVANTAGE_KEY
) {
  console.warn("Please set your Hasura or AlphaVantage keys.");
}

server.listen(port, () => console.log(`server started at port:  ${port}`));

const router = express.Router();

router.get("/sync", (_, res) => {
  console.info("Intraday triggered");
  syncStocks();
  res.send("Intraday values will shortly be in sync...");
});

app.use("/intraday", router);
