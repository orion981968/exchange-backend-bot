const axios = require("axios");
const fs = require("fs");
var FormData = require("form-data");

//import configs
const { orderArgs } = require("../config/args");
const constants = require("../config/consts");
const { backend } = require("../config/config");

const sellOrderEndpoint = backend + "/orders/sell";

var successfulSellOrders = [],
  failedSellOrders = [],
  errorSellOrders = [];

const makeSellOrder = (order, length) => {
  axios.post(sellOrderEndpoint, order.formData, {
    headers: {
      ...order.formHeaders,
    },
  })
  .then((res) => {
    if (res.data.Success) {
      successfulSellOrders.push({ pair: order.pair, userId: order.userId });
      console.log("success true", res.data);
    } else {
      failedSellOrders.push(res.data);
      console.log("success false", res.data);
    }
  })
  .catch((err) => {
    errorSellOrders.push(err.message);
    console.log("failed", err.message);
  })
  .then(() => {
    if (
      successfulSellOrders.length +
        failedSellOrders.length +
        errorSellOrders.length ===
      length
    ) {
      fs.writeFileSync(
        __dirname + "/../data/sell-order/successfulSellOrders.json",
        JSON.stringify(successfulSellOrders, null, "\t")
      );

      fs.writeFileSync(
        __dirname + "/../data/sell-order/failedSellOrders.json",
        JSON.stringify(failedSellOrders, null, "\t")
      );

      fs.writeFileSync(
        __dirname + "/../data/sell-order/errorSellOrders.json",
        JSON.stringify(errorSellOrders, null, "\t")
      );
    }
  });
};

const main = async () => {
  const selectedUserCnt = orderArgs.user;

  const users = await constants.getRandomSelectedUsers(selectedUserCnt);

  if (!users) {
    process.exit();
  }

  const coinpairs = await constants.getAllCoinPairs();

  if (!coinpairs) {
    process.exit();
  }

  //make data for individual order and post order
  let orders = [];
  let orderInfo = [];
  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    //make possible coin for sell order by checking its balance
    if (user.Balance !== null) {
      for (const [coin, balance] of Object.entries(user.Balance)) {
        // get all coin pairs with this coin
        for (let j = 0; j < coinpairs.length; j++) {
          let coinpair = coinpairs[j];

          if (coinpair.Pair.startsWith(coin)) {
            if (!coinpair.Price) continue;

            // Random price between 21~50, amount 1~20
            let orderPrice = Math.floor(Math.random() * 20) + 1;
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

  fs.writeFileSync(
    __dirname + "/../data/sell-order/orderInfo.json",
    JSON.stringify(orderInfo, null, "\t")
  );

  for (let i = 0; i < orders.length; i++) {
    // check if to write into log files
    makeSellOrder(orders[i], orders.length);
  }
};

main();
