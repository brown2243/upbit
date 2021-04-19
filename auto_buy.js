const WebSocket = require("ws");
const Upbit = require("./upbit_lib");
const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;

const upbit = new Upbit(secret_key, access_key);

let trades = {};

let cutList = [];
cutList.push({
  market: "KRW-TRX",
  cut_price: 41.6,
  volume: 3.3,
});
cutList.push({
  market: "KRW-STEEM",
  cut_price: 437,
  volume: 5,
});

const arr = [
  { coin: "QTCON", AVG: 110.8, target: "8.366" },
  { coin: "HUNT", AVG: 556.8, target: "63.855" },
  { coin: "SBD", AVG: 12258, target: "1591.425" },
  // { coin: "MOC", AVG: 234, target: "28.215" },
  // { coin: "CBK", AVG: 9745, target: "836.550" },
  // { coin: "PLA", AVG: 674.8, target: "54.450" },
  // { coin: "TON", AVG: 19110, target: "2014.650" },
  // { coin: "UPP", AVG: 246.8, target: "34.650" },
  // { coin: "PXL", AVG: 153.2, target: "13.860" },
  // { coin: "DMT", AVG: 1653, target: "180.675" },
];
buyList(arr);
function buyList(arr) {
  arr.forEach((coin) => {
    const market = `KRW-${coin["coin"]}`;
    cutList.push({
      market: market,
      cut_price: 0,
    });
  });
}

function tradeServerConnect(codes) {
  var ws = new WebSocket("wss://api.upbit.com/websocket/v1");
  console.log(codes);
  ws.on("open", () => {
    console.log("trade websocket is connected");
    ws.send(
      '[{"ticket":"fiwjfoew"},{"type":"trade","codes":[' +
        codes +
        '], "isOnlyRealtime":"true"},{"format":"SIMPLE"}]'
    );
  });
  ws.on("close", () => {
    console.log("trade websocket is closed");
    setTimeout(function () {
      console.log("trade 재접속");
      tradeServerConnect(codes);
    }, 1000);
  });
  ws.on("message", (data) => {
    try {
      var str = data.toString("utf-8");
      var json = JSON.parse(str);
      trades[json.cd] = json;
    } catch (e) {
      console.log(e);
    }
  });
}

function searchLoop(coin) {
  // 현황 (10초 반복)
  const market = `KRW-${coin["coin"]}`;
  console.log("searchLoop");
  setInterval(async () => {
    if (!trades[market]) return;
    if (!trades[market].tp) return;
    let tradePrice = parseFloat(trades[market].tp);
    if (!tradePrice) return;

    console.log(
      "[",
      market,
      "현재가",
      tradePrice,
      "매수 목표가",
      tradePrice + Number(coin["target"]),
      "]"
    );
  }, 10000);

  // 손절처리 (1초 반복)
  setInterval(async () => {
    if (!trades[market]) return;
    if (!trades[market].tp) return;
    let tradePrice = parseFloat(trades[market].tp);
    if (!tradePrice) return;

    // cutList에서 손절대상 찾기
    let found = cutList.findIndex((el) => {
      return el.market == market && el.cut_price >= tradePrice;
    });
    // 찾았으면..
    if (found != -1) {
      console.log("손절처리!");
      console.log("tradePrice:" + tradePrice);

      let json;
      json = await upbit.trade_orderbook(cutList[found].market);
      if (!json.success) {
        console.log("upbit.trade_orderbook");
        console.log(json.message);
        return;
      }

      // let sellPrice = json.data[0].orderbook_units[0].bid_price;
      // console.log("sellPrice:" + sellPrice);

      // console.log("--order_ask");
      // json = await upbit.order_ask(
      //   cutList[found].market,
      //   cutList[found].volume,
      //   sellPrice
      // );
      // //json = {success:true}
      // if (json.success) {
      //   cutList.splice(found, 1);
      //   console.log("처리완료!");
      //   console.log(cutList);
      // } else {
      //   console.log(json.name);
      //   console.log(json.message);
      // }
    }
  }, 1000);
}

async function start(markets) {
  console.log("마켓수:" + markets.length);
  let code_list = [];
  for (let coin of markets) {
    const market = `KRW-${coin["coin"]}`;
    trades[market] = false;
    code_list.push(`"${market}"`);
    searchLoop(coin);
  }

  // 체결 서버 접속
  tradeServerConnect(code_list.join(","));
}
start(arr);

//////////////
// async function start() {
//   let { data: markets } = await upbit.market_all();
//   console.log("마켓수:" + markets.length);

//   let code_list = [];
//   for (let item of markets) {
//     console.log(item);
//     // KRW-ETH BTC-ETH ..
//     let [currency, coin] = item.market.split("-");
//     // 원화만
//     if (currency != "KRW") continue;

//     trades[item.market] = {};
//     code_list.push('"' + item.market + '"');

//     searchLoop(item.market);
//   }
//   console.log("원화마켓수:" + code_list.length);

//   // 체결 서버 접속
//   tradeServerConnect(code_list.join(","));
// }

// start();

// function searchLoop(market) {
//   // 현황 (10초 반복)
//   setInterval(async () => {
//     if (!trades[market]) return;
//     if (!trades[market].tp) return;
//     let tradePrice = parseFloat(trades[market].tp);
//     if (!tradePrice) return;

//     for (let item of cutList) {
//       if (item.market == market) {
//         console.log("/////////////////////////////");
//         console.log(
//           "[",
//           market,
//           "손절가",
//           item.cut_price,
//           "현재가",
//           tradePrice,
//           "(" + (tradePrice - item.cut_price).toFixed(2) + ")",
//           "]"
//         );
//       }
//     }
//   }, 10000);

//   // 손절처리 (1초 반복)
//   setInterval(async () => {
//     if (!trades[market]) return;
//     if (!trades[market].tp) return;
//     let tradePrice = parseFloat(trades[market].tp);
//     if (!tradePrice) return;

//     // cutList에서 손절대상 찾기
//     let found = cutList.findIndex((el) => {
//       return el.market == market && el.cut_price >= tradePrice;
//     });
//     // 찾았으면..
//     if (found != -1) {
//       console.log("손절처리!");
//       console.log("tradePrice:" + tradePrice);

//       let json;
//       json = await upbit.trade_orderbook(cutList[found].market);
//       if (!json.success) {
//         console.log("upbit.trade_orderbook");
//         console.log(json.message);
//         return;
//       }

//       // let sellPrice = json.data[0].orderbook_units[0].bid_price;
//       // console.log("sellPrice:" + sellPrice);

//       // console.log("--order_ask");
//       // json = await upbit.order_ask(
//       //   cutList[found].market,
//       //   cutList[found].volume,
//       //   sellPrice
//       // );
//       // //json = {success:true}
//       // if (json.success) {
//       //   cutList.splice(found, 1);
//       //   console.log("처리완료!");
//       //   console.log(cutList);
//       // } else {
//       //   console.log(json.name);
//       //   console.log(json.message);
//       // }
//     }
//   }, 1000);
// }
