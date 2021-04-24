require("dotenv").config();
const fs = require("fs");
const WebSocket = require("ws");
const moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;

const Upbit = require("./upbit_lib");

const cheapCoins = [
  "KRW-ONG",
  "KRW-PLA",
  "KRW-SSX",
  "KRW-CBK",
  "KRW-TON",
  "KRW-HUNT",
  "KRW-AQT",
  "KRW-PXL",
  "KRW-SBD",
  "KRW-QTCON",
  "KRW-DMT",
  "KRW-MOC",
  "KRW-OBSR",
  "KRW-UPP",
  "KRW-STPT",
  "KRW-EDR",
  "KRW-AERGO",
  "KRW-HUM",
  "KRW-EMC2",
  "KRW-IGNIS",
  "KRW-RFR",
  "KRW-SOLVE",
  "KRW-LBC",
  "KRW-GRS",
  "KRW-MBL",
  "KRW-STRK",
  "KRW-LAMB",
  "KRW-TT",
  "KRW-MLK",
  "KRW-ADX",
  "KRW-GAS",
  "KRW-CRE",
  "KRW-LOOM",
  "KRW-DKA",
  "KRW-MARO",
  "KRW-MFT",
  "KRW-BORA",
  "KRW-DAWN",
  "KRW-POWR",
  "KRW-HIVE",
  "KRW-TSHP",
  "KRW-META",
  "KRW-QKC",
  "KRW-POLY",
  "KRW-ELF",
  "KRW-MTL",
  "KRW-IQ",
  "KRW-ARK",
  "KRW-AXS",
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
  "KRW-CVC",
  "KRW-ARDR",
  "KRW-STEEM",
  "KRW-SAND",
  "KRW-GLM",
  "KRW-STMX",
  "KRW-REP",
  "KRW-FCT2",
];
// .forEach((v, i) => console.log(i, v));
///////////////////////////////////

const upbit = new Upbit(secret_key, access_key);
const checkList = {};
const wallet = {};
const coinInfo = {};
const buyCount = [0, 0, 0]; // 1. profit <= 0.035, 2. 0.035 < profit
// 1. 매수 1번 매도, 2.매수 2번 매도, 3. 1시간 뒤 매도, 4. 손절
const sellCount = [0, 0, 0, 0, 0];

cheapCoins.forEach((v) => {
  checkList[v] = {
    weHave: false,
    canBuy: true,
  };
});

/////////////////////////////////////
// allSell();
// init();
updateWallet().then((res) => console.log("1", wallet));

async function init() {
  console.log("시작합니다.");
  await updateWallet();
  const KRW = Number(wallet.KRW.balance);
  const CNT = 10; // 원금 분할 할 때
  const splitedKRW = CNT ? Math.floor(KRW / CNT) - 100 : 0;
  console.log(`${CNT} 분할, ${splitedKRW}원`);
  wallet["splitedKRW"] = 60000; // 그냥 고정으로
  wallet["cnt"] = CNT;
  // 10만원

  cheapCoins.forEach(async (coin, i) => {
    setTimeout(async () => {
      const value = await getTargetPrice(coin);
      coinInfo[coin] = value;
    }, i * 280);
  });

  // AVG가 4시간 봉을 기준으로 하기 때문에, 매 시간 업데이트 해줘야함
  setInterval(() => {
    const date = moment().format("YYYY-MM-DD HH:mm:ss").substring(11, 16);
    const hours = date.substr(0, 2);
    const mins = date.substr(3, 2);
    console.log(`${hours}:${mins}`);
    if (mins === "01") {
      console.log("코인 가격 업데이트");
      cheapCoins.forEach(async (coin, i) => {
        setTimeout(async () => {
          const value = await getTargetPrice(coin);
          coinInfo[coin] = value;
        }, i * 280);
      });
    }
  }, 1000 * 60);

  setTimeout(() => {
    serverStart();
  }, cheapCoins.length * 300);
}

async function serverStart() {
  const code_list = Object.keys(coinInfo).map((v) => `"${v}"`);
  console.log("체크하는 코인 갯수: " + code_list.length);
  console.log(coinInfo);
  tradeServerConnect(code_list.join(","));
}

function tradeServerConnect(codes) {
  console.log("tradeServerConnect");
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
    setTimeout(function () {
      console.log("trade 재접속");
      tradeServerConnect(codes);
    }, 1000);
  });
  ws.on("message", async (data) => {
    try {
      const str = data.toString("utf-8");
      const json = JSON.parse(str);
      const coin = json.cd.substring(4);
      const buyPrice = coinInfo[json.cd].avg + coinInfo[json.cd].buy;
      const sellPrice = coinInfo[json.cd].avg + coinInfo[json.cd].sell;
      // // wallet에 있으면 매도체크
      // if (checkList[json.cd].weHave) {
      //   if (
      //     (wallet[json.cd],
      //     coinInfo[json.cd].profit >= 0.035 && sellPrice <= json.tp)
      //   ) {
      //     console.log(`${json.cd}코인, 현재가 ${json.tp}원 에서 매도`);
      //     sellProcess(2, json.cd, wallet[coin].balance);
      //   }
      //   // profit 0.035 이하
      //   else if (
      //     coinInfo[json.cd].profit < 0.035 &&
      //     coinInfo[json.cd].avg * 1.15 <= json.tp
      //   ) {
      //     console.log(`${json.cd}코인, 현재가 ${json.tp}원 에서 매도`);
      //     sellProcess(1, json.cd, wallet[coin].balance);
      //   }
      //   // 평균가 대비 -5% 빠지면 손절
      //   // 매수 시점이 평균가 보다 높기 때문에 손실은 6 ~ 7%(수수료+슬리피지)
      //   else if (json.tp <= coinInfo[json.cd].avg * 0.95) {
      //     sellProcess(4, json.cd, wallet[coin].balance);
      //   }
      // }
      // // 매수 조건
      // else
      if (
        wallet["KRW"].balance >= wallet.splitedKRW &&
        checkList[json.cd].canBuy &&
        coinInfo[json.cd].profit > 0.015
      ) {
        // profit이 ~ 0.035는 sell에 매수해서 1.15배에 매도
        if (
          coinInfo[json.cd].profit < 0.035 &&
          sellPrice <= json.tp &&
          json.tp < sellPrice * 1.005
        ) {
          console.log(
            `1번 ${json.cd}코인 현재가 ${json.tp}원 매도가 ${
              coinInfo[json.cd].avg * 1.15
            }원`
          );
          buyProcess(1, json.cd, wallet.splitedKRW * 1.25);

          // profit이 0.035 이상은 buy에 매수해서 sell 매도
        } else if (
          coinInfo[json.cd].profit >= 0.035 &&
          buyPrice <= json.tp &&
          json.tp < buyPrice * 1.005
        ) {
          console.log(
            `2번${json.cd}코인 현재가 ${json.tp}원 매도가 ${sellPrice}원`
          );
          buyProcess(2, json.cd, wallet.splitedKRW);
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
}

// 계좌 업데이트
async function updateWallet() {
  const account = await upbit.accounts();
  console.log("계좌 업데이트");
  account.data.forEach((coin, i) => {
    if (coin.currency === "ADA" || coin.currency === "VET") {
      return;
    }
    wallet[coin.currency] = {
      balance: coin.balance,
      avg_buy_price: coin.avg_buy_price,
    };
    checkList[`KRW-${coin.currency}`] = {
      weHave: true,
      canBuy: false,
    };
    // if (i !== 0) {
    //   checkList[`KRW-${coin.currency}`].weHave = true;
    //   checkList[`KRW-${coin.currency}`].canBuy = false;
    // }
  });
  console.log(wallet);
}

// 4시간 봉, 전날 고가 - 저가 갭 가져오는 함수
async function getTargetPrice(coin) {
  const days = await upbit.market_day(coin, null, 1);
  const hours = await upbit.market_minute(coin, 60, null, 4); // 매 시 1분에 실행
  // console.log(days.remain_sec, days.remain_min);
  // console.log(hours.remain_sec, hours.remain_min);
  if (!days.data || !hours.data) {
    console.log("getTargetPrice error", coin);
    return { coin: coin, error: true };
  }

  const gap = days.data[0].high_price - days.data[0].low_price;
  const hours_AVG =
    hours.data.reduce((acc, cur, i) => {
      return acc + cur["trade_price"];
    }, 0) / hours.data.length;

  const buy = Number((gap * 0.15).toFixed(3));
  const sell = Number((gap * 0.49).toFixed(3));

  return {
    avg: hours_AVG,
    buy: buy,
    sell: sell,
    profit: (sell - buy) / hours_AVG,
  };
}

// 매수
async function buyProcess(type, coin, price) {
  if (type === 1) buyCount[1] += 1;
  else if (type === 2) buyCount[2] += 1;
  checkList[coin].weHave = true;
  checkList[coin].canBuy = false;
  console.log(buyCount);
  // 매수 함수(정해진 금액 시장가 매수)
  await upbit.order_bid(coin, price).then(updateWallet);

  // // 1시간 뒤에도 홀딩중이면, 전량 매도 로직
  //     setTimeout(() => {
  //       if(checkList[coin].weHave){
  //         sellProcess(3, coin, balance)
  //       }
  //     }, 1000*60*60)
}
// 매도
async function sellProcess(type, coin, balance) {
  if (type === 1) sellCount[1] += 1;
  else if (type === 2) sellCount[2] += 1;
  else if (type === 3) sellCount[3] += 1;
  else if (type === 4) sellCount[4] += 1;

  // 팔자마자 하락해서 재 매수 되는 상황 방지를 위해
  checkList[coin].weHave = false;
  checkList[coin].canBuy = false;
  setTimeout(() => {
    checkList[coin].canBuy = true;
  }, 1000 * 60 * 30 * type);

  console.log(`${type}. ${coin}코인 매도`);
  console.log(sellCount);
  // 매도 함수(전량 시장가 매도)
  await upbit.order_ask(coin, balance).then(updateWallet);
}

// 모든 종목 매도
async function allSell() {
  const account = await upbit.accounts();
  account.data.forEach((coin, i) => {
    if (i === 0 || coin.currency === "ADA" || coin.currency === "VET") {
      return;
    }
    setTimeout(async () => {
      console.log(coin);
      const sellOrder = await upbit.order_ask(
        `KRW-${coin.currency}`,
        coin.balance
      );
      console.log(sellOrder);
    }, i * 500);
  });
}
// async function allSell() {
//   const account = await upbit.accounts();
//   account.data.forEach((coin, i) => {
//     if (i === 0) {
//       return;
//     }
//     setTimeout(async () => {
//       console.log(coin);
//       const sellOrder = await upbit.order_ask(
//         `KRW-${coin.currency}`,
//         coin.balance
//       );
//       console.log(sellOrder);
//     }, i * 500);
//   });
// }

// 직전 5일의 종가 평균
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
