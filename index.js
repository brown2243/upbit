require("dotenv").config();
const request = require("request");
const rp = require("request-promise");
const fs = require("fs");
const uuidv4 = require("uuid/v4");
const sign = require("jsonwebtoken").sign;
const fetch = require("node-fetch");
const Upbit = require("./upbit_lib");

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;
const server_url = process.env.UPBIT_OPEN_API_SERVER_URL;

// Upbit.prototype.accounts = accounts;
// Upbit.prototype.order_list = order_list;
// Upbit.prototype.order_bid = order_bid;
// Upbit.prototype.order_ask = order_ask;
// Upbit.prototype.order_detail = order_detail;
// Upbit.prototype.order_delete = order_delete;
// Upbit.prototype.order_chance = order_chance;
// Upbit.prototype.market_all = market_all;
// Upbit.prototype.market_minute = market_minute;
// Upbit.prototype.market_day = market_day;
// Upbit.prototype.market_week = market_week;
// Upbit.prototype.market_month = market_month;
// Upbit.prototype.market_trade_tick = market_trade_tick;
// Upbit.prototype.market_ticker = market_ticker;
// Upbit.prototype.trade_orderbook = trade_orderbook;

const cheapCoins = [
  "ONG",
  "PLA",
  "SSX",
  "CBK",
  "TON",
  "HUNT",
  "AQT",
  "PXL",
  // "SBD",
  // "QTCON",
  // "DMT",
  // "MOC",
  // "OBSR",
  // "UPP",
  // "STPT",
  // "EDR",
  // "AERGO",
  // "HUM",
  // "EMC2",
  // "IGNIS",
  // "RFR",
  // "SOLVE",
  // "LBC",
  // "GRS",
  // "MBL",
  // "STRK",
  // "LAMB",
  // "TT",
  // "MLK",
  // "ADX",
  // "GAS",
  // "CRE",
  // "LOOM",
  // "DKA",
  // "MARO",
  // "MFT",
  // "BORA",
  // "DAWN",
  // "POWR",
  // "HIVE",
  // "TSHP",
  // "META",
  // "QKC",
  // "POLY",
  // "ELF",
  // "MTL",
  // "IQ",
  // "ARK",
  // "AXS",
  // "SRM",
  // "MED",
  // "STRAX",
  // "WAXP",
  // "ORBS",
  // "JST",
];
// .forEach((v, i) => console.log(i, v));
function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

async function check5daysAVG(upbit, coin) {
  const data = await upbit.market_day("KRW-" + coin, null, 5);
  // console.log(data.data);
  if (!data.data) {
    console.log("check5daysAVG error", coin, data.data);
    return { coin: coin, error: true };
  }
  const AVG =
    data.data.reduce((acc, cur, i) => {
      return acc + cur["prev_closing_price"];
    }, 0) / 5;
  const target = (
    (data.data[0].high_price - data.data[0].low_price) *
    0.495
  ).toFixed(3);
  return { coin: coin, AVG: AVG, target: target };
}

// 한번에 다 가져오면, 갯수제한에 걸려서 안되는가 싶었다.
// 그러나 어떻게 지연을 시켜도, 갯수가 많아지면 값을 제대로 못받는 코인이 있음
// 내가 손으로 5개씩 받아오면 잘되는데, 반복문으로 5개씩 부르고 지연을 10초씩 줘도 안됌.
async function init() {
  console.log("시작합니다.");
  const upbit = new Upbit(secret_key, access_key);
  const DP_5daysAvg = [];
  cheapCoins.forEach(async (coin, i) => {
    // if (i % 5 === 0) await sleep(2000);
    console.log(`${i}번째`);
    // await sleep(2000);
    const value = await check5daysAVG(upbit, coin);
    DP_5daysAvg.push(value);
  });
  setTimeout(() => {
    console.log(DP_5daysAvg);
  }, 2000);
}
init();

// async function myAccount() {
//   // 내 자산 조회
//   const payload = {
//     access_key: access_key,
//     nonce: uuidv4(),
//   };

//   const token = sign(payload, secret_key);

//   const options = {
//     method: "GET",
//     url: server_url + "/v1/accounts",
//     headers: { Authorization: `Bearer ${token}` },
//   };

//   request(options, (error, response, body) => {
//     if (error) throw new Error(error);
//     fs.writeFile("myAccount.js", body, (err) => {
//       if (err) console.log(err);
//     });
//   });
// }

// async function showCoinTickerList() {
//   // 전체 목록 조회
//   // 전체 목록중 KRW거래가 가능한 코인 티커만 coinlist파일에 기록하는 기능
//   const options = { method: "GET" };

//   fetch("https://api.upbit.com/v1/market/all?isDetails=false", options)
//     .then((res) => {
//       res.json().then((data) => {
//         if (data["error"]) {
//           console.log("error");
//           return;
//         }
//         const filtered = data
//           .map((v) => {
//             const [front, back] = v["market"].split("-");
//             if (front === "KRW") {
//               return back;
//             }
//           })
//           .filter((v) => v);
//         console.log(filtered);
//         const text = filtered.map((v) => `${JSON.stringify(v)}\n`).toString();
//         fs.writeFile("coinlist.js", text, "utf8", (err) => {
//           console.log(err);
//         });
//       });
//     })
//     .catch((err) => console.error(err));
// }
// // name은 종목 Ticker, type은 [days, weeks, months],count는 캔들 갯수
// function fetchCandleData(name, type, count) {
//   // 한번에 가져올 수 있는 캔들은 200개인데
//   // 언제부터 언제까지를 설정할 수 없기 때문에 200개 이상의
//   // 과거 캔들을 가져올순 없는 듯.
//   const options = { method: "GET" };
//   const URL = `https://api.upbit.com/v1/candles/${type}/?market=KRW-${name}&count=${count}`;
//   fetch(URL, options)
//     .then((res) => {
//       res.json().then((data) => {
//         if (data["error"]) {
//           console.log("error");
//           return;
//         }
//         return data;
//         // const text = data.map((v) => `${JSON.stringify(v)}\n`).toString();
//         // fs.writeFile("KRW-BTC.txt", text, "utf8", (err) => {
//         //   console.log(err);
//         // });
//       });
//     })
//     .catch((err) => console.error(err));
// }
// // 분 단위. 가능한 값 : 1, 3, 5, 15, 10, 30, 60, 240
// function fetchCandleDataMinute(name, min, count) {
//   const options = { method: "GET" };
//   const URL = `https://api.upbit.com/v1/candles/minutes/${min}?market=KRW-${name}&count=${count}`;
//   fetch(URL, options)
//     .then((res) => {
//       res.json().then((data) => {
//         if (data["error"]) {
//           console.log("error");
//           return;
//         }
//         console.log(data);
//         // const text = data.map((v) => `${JSON.stringify(v)}\n`).toString();
//         // fs.writeFile("KRW-BTC.txt", text, "utf8", (err) => {
//         //   console.log(err);
//         // });
//       });
//     })
//     .catch((err) => console.error(err));
// }
// // 현재가 정보
// function priceNow() {
//   const options = { method: "GET" };
//   fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC", options)
//     .then((res) => {
//       res.json().then((data) => console.log(data));
//     })
//     .catch((err) => console.error(err));
// }

// function checkBeforeBuy(coinlist) {
//   const arr = [];
//   coinlist.forEach((coin, i) => {
//     setTimeout(() => {
//       const data = fetchCandleData(coin, "days", 5);
//       console.log(data);
//     }, i * 200);
//   });
// }
// // checkBeforeBuy(["IQ", "BTC"]);
