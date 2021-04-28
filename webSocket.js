const WebSocket = require("ws");

module.exports = (server) => {
  const ws = new WebSocket.Server({ server });
  ws.on("connection", () => {
    console.log("trade websocket is connected");
    ws.send(
      '[{"ticket":"fiwjfoew"},{"type":"trade","codes":[' +
        codes +
        '], "isOnlyRealtime":"true" },{"format":"SIMPLE"}]'
    );
  });
  ws.on("close", () => {
    console.log("trade websocket is closed");
    if (isServerOpenTime) {
      console.log("trade websocket is closed by Error");
      setTimeout(function () {
        console.log("trade 재접속");
        tradeServerConnect(codes);
      }, 1000);
    }
  });
  ws.on("message", async (data) => {
    try {
      const str = data.toString("utf-8");
      const json = JSON.parse(str);
      const coin = json.cd.substring(4);
      const buyPrice = coinInfo[json.cd].avg + coinInfo[json.cd].buy;
      const sellPrice = coinInfo[json.cd].avg + coinInfo[json.cd].sell;
      console.log(json);
      // 고점대비 -10% 하락하면 매도
      if (checkList[json.cd].weHave) {
        if (checkList[json.cd].topPrice < json.tp) {
          checkList[json.cd].topPrice = json.tp;
        } else if (checkList[json.cd].topPrice * 0.905 >= json.tp) {
          console.log(`${json.cd}코인, 현재가 ${json.tp}원 에서 매도`);
          // sellProcess(json.cd, json.tp);
        }
      }

      // wallet에 있으면 매도체크
      // if (checkList[json.cd].weHave) {
      //   // profit 0.035 이상
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
      // 매수 조건
      else if (
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
          console.log(`1번 ${json.cd}코인 현재가 ${json.tp}원`);
          // buyProcess(1, json.cd, wallet.splitedKRW * 1.25);

          // profit이 0.035 이상은 buy에 매수해서 sell 매도
        } else if (
          coinInfo[json.cd].profit >= 0.035 &&
          buyPrice <= json.tp &&
          json.tp < buyPrice * 1.005
        ) {
          console.log(`2번${json.cd}코인 현재가 ${json.tp}원`);
          // buyProcess(2, json.cd, wallet.splitedKRW);
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
};
