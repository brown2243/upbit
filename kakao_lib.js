// require("dotenv").config();

// const KAKAO_NATIVE_KEY = process.env.KAKAO_NATIVE_KEY;
// const KAKAO_RESTAPI_KEY = process.env.KAKAO_RESTAPI_KEY;
// const KAKAO_JS_KEY = process.env.KAKAO_JS_KEY;
// const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
// const redirect_uri = "https://example.com/oauth";

// const request = require("request");
// const querystring = require("querystring");

// let template_objectObj = {
//   object_type: "text",
//   text: " Hello Kakao!(텍스트 영역입니다. 최대 200자 표시 가능합니다.)",
//   link: {
//     web_url: "https://developers.kakao.com",
//     mobile_web_url: "https://developers.kakao.com",
//   },
// };

// // Javascript -> JSON 타입으로 변경
// let template_objectStr = JSON.stringify(template_objectObj);
// let options = {
//   url: "https://kapi.kakao.com/v2/api/talk/memo/default/send",
//   method: "POST",

//   headers: {
//     Authorization: "Bearer xxxxxxxxxxxxxxxxxxxxxx",
//     "Content-Type": "application/x-www-form-urlencoded",
//   },
//   form: {
//     template_object: template_objectStr,
//   },
// };

// function callback(error, response, body) {
//   console.log(response.statusCode);
//   if (!error && response.statusCode == 200) {
//     console.log(body);
//   }
// }
// request(options, callback);

// const fs = require("fs");
// const data = "SADASdASdasdda";
// fs.writeFile("./trading.txt", data + "\n", "utf8", (err) => {
//   console.log(err);
// });
// fs.appendFile("./trading.txt", data, "utf8", (err) => {
//   console.log(err);
// });
