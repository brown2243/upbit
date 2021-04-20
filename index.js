require("dotenv").config();
const fs = require("fs");
const WebSocket = require("ws");
const Upbit = require("./upbit_lib");

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;

const cheapCoins = [
  "KRW-ONG",
  "KRW-PLA",
  "KRW-SSX",
  "KRW-CBK",
  "KRW-TON",
  "KRW-HUNT",
  // "KRW-AQT",
  "KRW-PXL",
  "KRW-SBD",
  "KRW-QTCON",
  "KRW-DMT",
  "KRW-MOC",
  "KRW-OBSR",
  "KRW-UPP",
  // "KRW-STPT",
  "KRW-EDR",
  "KRW-AERGO",
  "KRW-HUM",
  // "KRW-EMC2",
  "KRW-IGNIS",
  "KRW-RFR",
  "KRW-SOLVE",
  "KRW-LBC",
  // "KRW-GRS",
  "KRW-MBL",
  "KRW-STRK",
  "KRW-LAMB",
  "KRW-TT",
  "KRW-MLK",
  // "KRW-ADX",
  "KRW-GAS",
  "KRW-CRE",
  // "KRW-LOOM",
  "KRW-DKA",
  "KRW-MARO",
  "KRW-MFT",
  "KRW-BORA",
  // "KRW-DAWN",
  "KRW-POWR",
  "KRW-HIVE",
  "KRW-TSHP",
  "KRW-META",
  "KRW-QKC",
  "KRW-POLY",
  // "KRW-ELF",
  "KRW-MTL",
  "KRW-IQ",
  "KRW-ARK",
  // "KRW-AXS",
  "KRW-SRM",
  "KRW-MED",
  "KRW-STRAX",
  "KRW-WAXP",
  "KRW-ORBS",
  "KRW-JST",
  "KRW-MVL",
  "KRW-KAVA",
  "KRW-SXP",
  "KRW-KMD",
  // "KRW-CVC",
  // "KRW-ARDR",
  "KRW-STEEM",
  "KRW-SAND",
  "KRW-GLM",
  "KRW-STMX",
  "KRW-REP",
];
// .forEach((v, i) => console.log(i, v));

async function check6daysAVG(upbit, coin) {
  const data = await upbit.market_day(coin, null, 6);
  // console.log(data.remain_sec, data.remain_min);
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

  const gap = Number(
    (data.data[1].high_price - data.data[1].low_price) * 0.495
  );
  // const target = Number((gap + data.data[0].opening_price).toFixed(4));
  // console.log(
  //   "COIN",
  //   coin,
  //   "GAP",
  //   gap.toFixed(3),
  //   "AVG",
  //   AVG,
  //   "T_Price",
  //   target
  // );
  const buy = data.data[0].opening_price + gap * 0.15;
  const sell = data.data[0].opening_price + gap;

  return {
    coin: coin,
    avg: AVG,
    opening: data.data[0].opening_price,
    buy: buy,
    sell: sell,
  };
  // return { coin: coin, AVG: AVG, target: target };
}

async function init() {
  console.log("시작합니다.");
  const upbit = new Upbit(secret_key, access_key);

  const account = await upbit.accounts();
  const KRW = Number(account.data[0].balance);
  const CNT = 14;
  const splitedKRW = Math.floor(KRW / CNT) - 100;
  console.log(`${CNT} 분할, ${splitedKRW}원`);
  const wallet = { KRW: splitedKRW, cnt: CNT };

  const DP_5daysAvg = {};
  cheapCoins.forEach(async (coin, i) => {
    setTimeout(async () => {
      const value = await check6daysAVG(upbit, coin);
      // if (value["AVG"] <= value["target"]) {
      // 5일 평균보다 매수가가 높아야 됨, 즉 우상향차트
      // DP_5daysAvg[value["coin"]] = {
      //   AVG: value["AVG"],
      //   target: value["target"],
      // };
      DP_5daysAvg[value["coin"]] = {
        opening: value["opening"],
        buy: value["buy"],
        sell: value["sell"],
      };
      // }
    }, i * 180);
  });
  setTimeout(() => {
    serverStart(DP_5daysAvg, wallet);
  }, cheapCoins.length * 200);
}

async function buyOrder(ticker, wallet) {
  const upbit = new Upbit(secret_key, access_key);
  const order = await upbit.order_bid(ticker, wallet["KRW"]);

  console.log("buyOrder", ticker, wallet, order);

  wallet["cnt"] = wallet["cnt"] - 1;
  console.log(`매수 횟수가 ${wallet["cnt"]}회 남았습니다.`);
}

async function serverStart(targetList, wallet) {
  const code_list = Object.keys(targetList).map((v) => `"${v}"`);
  // 만약에 모든 종목을 매수 한다면 작동되는 코드
  // if (code_list.length === 0) {
  //   console.log("매수가 완료되었습니다!!");
  //   process.exit();
  // }

  console.log("매수 대기 코인 갯수: " + code_list.length);
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
  ws.on("message", async (data) => {
    try {
      const str = data.toString("utf-8");
      const json = JSON.parse(str);
      if (targetList[json.cd] && targetList[json.cd].buy <= json.tp) {
        console.log(json.cd, json.tp, targetList[json.cd]);
        console.log(json.cd, "코인 매수 진행");
        // 매수 함수 실행
        buyOrder(json.cd, wallet);
        wallet[json.cd] = { ...targetList[json.cd], isSelled: false };
        console.log(wallet[json.cd]);
        if (wallet.cnt <= 0) {
          console.log("매수가 완료되었습니다!!");
          ws.close();
        }
        delete targetList[json.cd];
        // serverStart(targetList);
      } else if (wallet[json.cd]) {
        if (wallet[json.cd].isSelled && wallet[json.cd].buy >= json.tp * 1.1) {
          console.log(`${json.cd}코인, 현재가${json.tp}`);
          console.log(`매수가 보다 낮아져 다시 편입`);
          targetList[json.cd] = {
            ...wallet[json.cd],
          };
          delete wallet[json.cd];
        } else if (
          !wallet[json.cd].isSelled &&
          wallet[json.cd].sell <= json.tp
        ) {
          const upbit = new Upbit(secret_key, access_key);
          console.log(
            `${json.cd}코인 현재가${json.tp}, 매도가${
              wallet[json.cd]
            } 매도 진행`
          );
          wallet[json.cd].isSelled = true;
          const account = await upbit.accounts();

          account.data.forEach(async (coin) => {
            if (json.cd === coin.currency) {
              const sellOrder = await upbit.order_ask(
                `KRW-${coin.currency}`,
                coin.balance
              );
              console.log(sellOrder);
            }
          });

          wallet["cnt"] = wallet["cnt"] + 1;
        }
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
  if (hours === "09" && mins === "18") {
    console.log("오전 08:57, 전량 매도 작동.");
    allSell();
  }

  if (hours === "09" && mins === "19") {
    console.log("오전 09:01, 매수 프로그램 다시 시작.");

    fs.appendFile("./trading.txt", date + "\n", "utf8", (err) => {
      console.log(err);
    });
    init();
  }
}, 60000);

init(); // 그냥 시작하려면
async function allSell() {
  const upbit = new Upbit(secret_key, access_key);
  const account = await upbit.accounts();

  account.data.forEach((coin, i) => {
    if (i === 0) {
      return;
    }

    setTimeout(async () => {
      console.log(coin);
      const sellOrder = await upbit.order_ask(
        `KRW-${coin.currency}`,
        coin.balance
      );
      fs.appendFile(
        "./trading.txt",
        `매도 ${coin.currency} , 금액 ${coin.balance}, ${sellOrder}\n`,
        "utf8",
        (err) => {
          console.log(err);
        }
      );
      console.log(sellOrder);
    }, i * 400);
  });

  setTimeout(async () => {
    const account = await upbit.accounts();
    console.log("전량 매도후, 현금 :", account.data[0]);
    fs.appendFile(
      "./trading.txt",
      "전량 매도후, 현금 :" + account.data[0] + "\n",
      "utf8",
      (err) => {
        console.log(err);
      }
    );
  }, account.length * 300);
}
