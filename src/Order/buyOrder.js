const axios = require("axios");
const fs = require("fs");
var FormData = require("form-data");

//import configs
const { orderArgs } = require("../config/args");
const constants = require("../config/consts");
const { backend } = require("../config/config");

const buyOrderEndpoint = backend + "/orders/buy";

var successfulBuyOrders = [],
  failedBuyOrders = [],
  errorBuyOrders = [];

const makeBuyOrder = async (order, length) => {
  axios
    .post(buyOrderEndpoint, order.formData, {
      headers: {
        ...order.formHeaders,
      },
    })
    .then((res) => {
      if (res.data.Success) {
        successfulBuyOrders.push({ pair: order.pair, userId: order.userId });
        console.log("success true", res.data);
      } else {
        failedBuyOrders.push(res.data);
        console.log("success false", res.data);
      }
    })
    .catch((err) => {
      errorBuyOrders.push(err.message);
      console.log("failed", err.message);
    })
    .then(() => {
      if (
        successfulBuyOrders.length +
          failedBuyOrders.length +
          errorBuyOrders.length ===
        length
      ) {
        fs.writeFileSync(
          __dirname + "/../data/buy-order/successfulBuyOrders.json",
          JSON.stringify(successfulBuyOrders, null, "\t")
        );

        fs.writeFileSync(
          __dirname + "/../data/buy-order/failedBuyOrders.json",
          JSON.stringify(failedBuyOrders, null, "\t")
        );

        fs.writeFileSync(
          __dirname + "/../data/buy-order/errorBuyOrders.json",
          JSON.stringify(errorBuyOrders, null, "\t")
        );
      }
    });
};

const main = async () => {
  console.log("start", new Date());
  const selectedUserCnt = orderArgs.user;

  const users = await constants.getRandomSelectedUsers(selectedUserCnt);

  if (!users) {
    process.exit();
  }

  const coinpairs = await constants.getAllCoinPairs();

  if (!coinpairs) {
    process.exit();
  }
  console.log("first", new Date());
  //make data for individual order and post order
  let orders = [];
  let orderInfo = [];
  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    //make possible coin for buy order by checking its balance
    if (user.Balance !== null) {
      for (const [coin, balance] of Object.entries(user.Balance)) {
        // get all coin pairs with this coin
        for (let j = 0; j < coinpairs.length; j++) {
          let coinpair = coinpairs[j];

          if (coinpair.Pair.startsWith(coin)) {
            if (!coinpair.Price) continue;

            // Random price between 21~50, amount 1~20
            let orderPrice = Math.floor(Math.random() * (80 - 50 + 1)) + 50;
            let orderAmount = Math.floor(Math.random() * 20) + 1;

            var formData = new FormData();
            formData.append("price", orderPrice);
            formData.append("amount", orderAmount);
            formData.append("pair", coinpair.Pair);
            formData.append("user_id", user.Id);

            const formHeaders = formData.getHeaders();

            orders.push({
              formData: formData,
              formHeaders: formHeaders,
              pair: coinpair.Pair,
              userId: user.Id,
            });

            orderInfo.push({
              pair: coinpair.Pair,
              user_id: user.Id,
            });
          }
        }
      }
    } else {
      console.log("There's nobody having balance");
    }
  }
  console.log("second", new Date());

  fs.writeFileSync(
    __dirname + "/../data/buy-order/orderInfo.json",
    JSON.stringify(orderInfo, null, "\t")
  );
  console.log("third", new Date());
  for (let i = 0; i < orders.length; i++) {
    // check if to write into log files
    await makeBuyOrder(orders[i], orders.length);
  }
  console.log("last", new Date());
};

main();
