require("dotenv").config();
const fs = require("fs");
const WebSocket = require("ws");
const Upbit = require("./upbit_lib");

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;

const cheapCoins = [
  "KRW-ONG",
  "KRW-PLA",
  // "KRW-SSX",
  // "KRW-CBK",
  // "KRW-TON",
  // "KRW-HUNT",
  // "KRW-AQT",
  // "KRW-PXL",
  // "KRW-SBD",
  // "KRW-QTCON",
  // "KRW-DMT",
  // "KRW-MOC",
  // "KRW-OBSR",
  // "KRW-UPP",
  // "KRW-STPT",
  // "KRW-EDR",
  // "KRW-AERGO",
  // "KRW-HUM",
  // "KRW-EMC2",
  // "KRW-IGNIS",
  // "KRW-RFR",
  // "KRW-SOLVE",
  // "KRW-LBC",
  // "KRW-GRS",
  // "KRW-MBL",
  // "KRW-STRK",
  // "KRW-LAMB",
  // "KRW-TT",
  // "KRW-MLK",
  // "KRW-ADX",
  // "KRW-GAS",
  // "KRW-CRE",
  // "KRW-LOOM",
  // "KRW-DKA",
  // "KRW-MARO",
  // "KRW-MFT",
  // "KRW-BORA",
  // "KRW-DAWN",
  // "KRW-POWR",
  // "KRW-HIVE",
  // "KRW-TSHP",
  // "KRW-META",
  // "KRW-QKC",
  // "KRW-POLY",
  // "KRW-ELF",
  // "KRW-MTL",
  // "KRW-IQ",
  // "KRW-ARK",
  // "KRW-AXS",
  // "KRW-SRM",
  // "KRW-MED",
  // "KRW-STRAX",
  // "KRW-WAXP",
  // "KRW-ORBS",
  // "KRW-JST",
  // "KRW-MVL",
];
// .forEach((v, i) => console.log(i, v)); // 55개

// async function sleep(ms) {
//   const wakeUpTime = Date.now() + ms;
//   while (Date.now() < wakeUpTime) {}
// }

async function check6daysAVG(upbit, coin) {
  const data = await upbit.market_day(coin, null, 6);
  console.log(data.remain_sec, data.remain_min);
  if (!data.data) {
    console.log("check5daysAVG error", coin, data.data);
    return { coin: coin, error: true };
  }
  const AVG =
    data.data.reduce((acc, cur, i) => {
      if (i === 0) {
        return 0;
      }
      return acc + cur["trade_price"];
    }, 0) / 5;

  const target = Number(
    (
      (data.data[1].high_price - data.data[1].low_price) * 0.49 +
      data.data[0].opening_price
    ).toFixed(4)
  );
  return { coin: coin, AVG: AVG, target: target };
}

// 한번에 다 가져오면, 갯수제한에 걸려서 안되는가 싶었다.
// 10개 초과하면 null
// 10개 받고 지연을 하든, 한번받고 지연한번을 하든 10개이상은 안줌.
// 최악의 경우에는 매일 내가 손으로 해야할 수도...
// settimeout으로 해결
async function init() {
  console.log("시작합니다.");
  const upbit = new Upbit(secret_key, access_key);

  const account = await upbit.accounts();
  const KRW = Number(account.data[0].balance);
  const CNT = 10;
  const splitedKRW = Math.floor(KRW / CNT) - 100;
  const wallet = { KRW: splitedKRW, cnt: CNT };

  const DP_5daysAvg = {};
  cheapCoins.forEach(async (coin, i) => {
    setTimeout(async () => {
      const value = await check6daysAVG(upbit, coin);
      DP_5daysAvg[value["coin"]] = {
        AVG: value["AVG"],
        target: value["target"],
      };
    }, i * 180);
  });
  setTimeout(() => {
    serverStart(DP_5daysAvg, wallet);
  }, cheapCoins.length * 200);
}
// init();

async function buyOrder(ticker, wallet) {
  console.log("buyOrder", ticker, wallet);
  const upbit = new Upbit(secret_key, access_key);

  const order = await upbit.order_bid(ticker, wallet["KRW"]);
  console.log(order);

  // 카톡 알림 기능 구현
  //

  wallet["cnt"] = wallet["cnt"] - 1;
}

async function serverStart(targetList, wallet) {
  const code_list = Object.keys(targetList).map((v) => `"${v}"`);
  // 만약에 모든 종목을 매수 한다면 작동되는 코드
  // if (code_list.length === 0) {
  //   console.log("매수가 완료되었습니다!!");
  //   process.exit();
  // }

  console.log("마켓수:" + code_list.length);
  // 체결 서버 접속
  tradeServerConnect(code_list.join(","), targetList, wallet);
}

function tradeServerConnect(codes, targetList, wallet) {
  console.log("tradeServerConnect", targetList);
  const ws = new WebSocket("wss://api.upbit.com/websocket/v1");
  ws.on("open", () => {
    console.log("trade websocket is connected");
    ws.send(
      '[{"ticket":"fiwjfoew"},{"type":"trade","codes":[' +
        codes +
        '], "isOnlyRealtime":"true" },{"format":"SIMPLE"}]'
    );
  });
  ws.on("close", () => {
    console.log("trade websocket is closed");
    // 다하면 서버 종료
    // setTimeout(function () {
    //   console.log("trade 재접속");
    //   tradeServerConnect(codes, targetList, wallet);
    // }, 1000);
  });
  ws.on("message", (data) => {
    try {
      const str = data.toString("utf-8");
      const json = JSON.parse(str);
      if (targetList[json.cd]) {
        // console.log(json.cd, json.tp, targetList[json.cd]);
        if (wallet.cnt <= 0) {
          console.log("매수가 완료되었습니다!!");
          ws.close();
        }

        if (
          json.tp >= targetList[json.cd].AVG &&
          json.tp >= targetList[json.cd].target
        ) {
          console.log(json.cd, json.tp, targetList[json.cd]);
          console.log(json.cd, "코인 매수 진행하고 시세체크 멈춤");
          // 매수 함수 실행
          // 코인 이름, 매수가
          // 잔고가 남았다면
          buyOrder(json.cd, wallet, ws);
          if (wallet.cnt <= 0) {
            console.log("매수가 완료되었습니다!!");
            ws.close();
          }
          delete targetList[json.cd];
          serverStart(targetList);
        }

        // 매수조건에 맞는 종목이 없어서(하락장)
        // 코드 작동여부 확인 위해 하방으로 설정해봤음.
        // if (
        //   json.tp <= targetList[json.cd].AVG &&
        //   json.tp <= targetList[json.cd].target
        // ) {
        //   console.log("낮다.");
        //   delete targetList[json.cd];
        //   start(targetList);
        // }
      }
    } catch (e) {
      console.log(e);
    }
  });
}

const moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

setInterval(async () => {
  const date = moment().format("YYYY-MM-DD HH:mm:ss").substring(11, 16);
  const hours = date.substr(0, 2);
  const mins = date.substr(3, 2);
  console.log(`${hours}:${mins}`);
  if (hours === "08" && mins === "58") {
    console.log("오전 08:58, 전량 매도 작동.");
    allSell();
  }

  if (hours === "09" && mins === "01") {
    console.log("오전 09:01, 매수 프로그램 다시 시작.");
    init();
  }
}, 1000);

async function allSell() {
  const upbit = new Upbit(secret_key, access_key);
  const account = await upbit.accounts();

  account.data.forEach((coin, i) => {
    if (i === 0) {
      return;
    }

    setTimeout(async () => {
      console.log(coin.currency, coin.balance);
      const sellOrder = await upbit.order_ask(coin.currency, coin.balance);
      console.log(sellOrder);
    }, i * 200);
  });

  setTimeout(async () => {
    const account = await upbit.accounts();
    console.log("전량 매도후, 현금", account.data[0]);
  }, account.length * 300);
}
