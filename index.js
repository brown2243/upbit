require("dotenv").config();
const request = require("request");
const fs = require("fs");
const uuidv4 = require("uuid/v4");
const sign = require("jsonwebtoken").sign;
const fetch = require("node-fetch");

const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY;
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY;
const server_url = process.env.UPBIT_OPEN_API_SERVER_URL;

// { // 내 자산 조회
//     const payload = {
//       access_key: access_key,
//       nonce: uuidv4(),
//     };

//     const token = sign(payload, secret_key);

//     const options = {
//       method: "GET",
//       url: server_url + "/v1/accounts",
//       headers: { Authorization: `Bearer ${token}` },
//     };

//     request(options, (error, response, body) => {
//       if (error) throw new Error(error);
//       console.log(body);
//     });

// }

// {
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

// // function fetchCandleData(name, type, count)
// {
//   // 한번에 가져올 수 있는 캔들은 200개인데
//   // 언제부터 언제까지를 설정할 수 없기 때문에 200개 이상의
//   // 과거 캔들을 가져올순 없는 듯.
//   const options = { method: "GET" };
//   fetch(
//     "https://api.upbit.com/v1/candles/weeks?market=KRW-BTC&count=300",
//     options
//   )
//     .then((res) => {
//       res.json().then((data) => {
//         if (data["error"]) {
//           console.log("error");
//           return;
//         }
//         const text = data.map((v) => `${JSON.stringify(v)}\n`).toString();
//         fs.writeFile("KRW-BTC.txt", text, "utf8", (err) => {
//           console.log(err);
//         });
//       });
//     })
//     .catch((err) => console.error(err));
// }

// {
//   const options = { method: "GET" };

//   fetch("https://api.upbit.com/v1/ticker?markets=KRW-BCH", options)
//     .then((res) => {
//       res.json().then((data) => console.log(data));
//     })
//     .catch((err) => console.error(err));
// }
