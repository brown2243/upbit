require("dotenv").config();
const fetch = require("node-fetch");
const rp = require("request-promise");
const coinList = require("./coinlist");
const Excel = require("exceljs");

const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet("My Sheet");

worksheet.columns = [
  { header: "Ticker", key: "Ticker", width: 20 },
  { header: "Market_Cap", key: "Market_Cap", width: 40 },
];

const requestOptions = {
  method: "GET",
  uri: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
  qs: {
    start: "1",
    limit: "5000",
    convert: "USD",
  },
  headers: {
    "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP,
  },
  json: true,
  gzip: true,
};

rp(requestOptions)
  .then((res) => {
    const data = res.data;
    console.log(data);
    // const filtered = data.filter((val) => coinList.includes(val["symbol"]));
    // const maped = filtered.map((val) => {
    //   const symbol = val["symbol"];
    //   const cap = val["quote"]["USD"]["market_cap"];
    //   return [symbol, cap];
    // });
    //   maped.forEach((v) => {
    //     worksheet.addRow({ Ticker: v[0], Market_Cap: v[1] });
    //   });
    //   workbook.xlsx.writeFile("MarketCap.xlsx");
  })
  .catch((err) => {
    console.log("API call error:", err.message);
  });

// save under export.xlsx
