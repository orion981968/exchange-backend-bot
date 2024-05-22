const axios = require("axios");
const fs = require("fs");
var FormData = require("form-data");

//import configs
const { backend } = require("../config/config");

const getAllUsers = async () => {
  var endpoint = backend + "/users/list";

  let res = await axios.post(endpoint);

  if (res.data !== undefined) {
    if (res.data.Success) {
      users = res.data.Data;
      return users;
    } else {
      console.log(
        "Get all users from api-server failed." + JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

const getAllCoinPairs = async () => {
  var endpoint = backend + "/coinpair/list";

  let res = await axios.post(endpoint);

  if (res.data !== undefined) {
    if (res.data.Success) {
      coinpairs = res.data.Data;
      return coinpairs;
    } else {
      console.log(
        "Get all coin pairs from api-server failed." +
          JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

const getTradeHistoryByPair = async (getTradeHistoryRequest) => {
  var endpoint = backend + "/tradehistory/history";

  let res = await axios.post(endpoint, getTradeHistoryRequest.formData, {
    headers: {
      ...getTradeHistoryRequest.formHeaders,
    },
  });

  if (res.data !== undefined) {
    if (res.data.Success) {
      return res.data.Data;
    } else {
      console.log(
        "Get all users from api-server failed." + JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

const getUserTradeHistory = async () => {
  var users = await getAllUsers();

  if (!users) {
    process.exit();
  }

  var coinpairs = await getAllCoinPairs();

  if (!coinpairs) {
    process.exit();
  }

  // make data for individual trade history
  var userTradeHistories = [];
  var getTradeHistoryRequest = {};
  for (let i = 0; i < users.length; i++) {
    let user = users[i];

    for (let j = 0; j < coinpairs.length; j++) {
      var formData = new FormData();

      formData.append("user_id", user.Id);
      formData.append("pair", coinpairs[j].Pair);

      const formHeaders = formData.getHeaders();

      getTradeHistoryRequest = {
        formData: formData,
        formHeaders: formHeaders,
      };

      userTradeHistories.push(
        await getTradeHistoryByPair(getTradeHistoryRequest)
      );
    }
  }

  return { userTradeHistories: userTradeHistories, users: users };
};

const getUserOrderList = async () => {
  var endpoint = backend + "/orders/open";
  var list = [];
  var users = await getAllUsers();

  if (!users) {
    process.exit();
  }

  for (let i = 0; i < users.length; i++) {
    var formData = new FormData();
    formData.append("user_id", users[i].Id);
    const formHeaders = formData.getHeaders();

    let res = await axios.post(endpoint, formData, {
      headers: {
        ...formHeaders,
      },
    });

    if (res.data !== undefined && res.data.Success) {
      list.push(res.data.Data);
    }
  }

  return list;
};

function groupBy(arr, criteria) {
  const newObj = arr.reduce(function (acc, currentValue) {
    if (!acc[currentValue[criteria]]) {
      acc[currentValue[criteria]] = [];
    }
    acc[currentValue[criteria]].push(currentValue);
    return acc;
  }, {});
  return newObj;
}

const main = async () => {
  var userOrderList = await getUserOrderList(); // get all individual user's order lists by user id

  var pairBalance1, pairBalance2;

  // calculate user order amount about each coin
  var userOrderAmountList = [];

  for (let i = 0; i < userOrderList.length; i++) {
    if (userOrderList[i] !== null) {
      for (let j = 0; j < userOrderList[i].length; j++) {
        pairBalance1 = 0;
        pairBalance2 = 0;
        if (userOrderList[i][j].side === 0) {
          pairBalance2 -=
            userOrderList[i][j].price * userOrderList[i][j].amount;
        } else if (userOrderList[i][j].side === 1) {
          pairBalance1 -= userOrderList[i][j].amount;
        }

        userOrderAmountList.push({
          userId: userOrderList[i][j].userid,
          pair: userOrderList[i][j].pair,
          coin1: pairBalance1,
          coin2: pairBalance2,
        });
      }
    }
  }

  var groupByUserIdOrderList = groupBy(userOrderAmountList, "userId");

  // get all individual user's trade history by each coin pair
  var { userTradeHistories, users } = await getUserTradeHistory();

  // calculate user's trade history by each coin pair
  var userBalanceInfoByPair = [];

  for (let i = 0; i < userTradeHistories.length; i++) {
    pairBalance1 = 0;
    pairBalance2 = 0;
    if (userTradeHistories[i] !== null) {
      for (let j = 0; j < userTradeHistories[i].length; j++) {
        if (userTradeHistories[i][j].Side === 0) {
          pairBalance1 +=
            userTradeHistories[i][j].Excuted - userTradeHistories[i][j].Fee;
          pairBalance2 -=
            userTradeHistories[i][j].Price * userTradeHistories[i][j].Excuted;
        } else if (userTradeHistories[i][j].Side === 1) {
          pairBalance1 -= userTradeHistories[i][j].Excuted;
          pairBalance2 +=
            userTradeHistories[i][j].Price *
            userTradeHistories[i][j].Excuted *
            0.9;
        }
      }

      userBalanceInfoByPair.push({
        userId: userTradeHistories[i][0].UserId,
        pair: userTradeHistories[i][0].Pair,
        coin1: pairBalance1,
        coin2: pairBalance2,
      });
    }
  }

  var groupByUserIdData = groupBy(userBalanceInfoByPair, "userId");

  // sum order list and trade history to get balance of accounts
  var newArray = [];

  for (let i = 1; i <= users.length; i++) {
    var btc = 10000000,
      usdt = 10000000,
      eth = 10000000,
      znx = 10000000,
      nxv = 10000000,
      bnb = 10000000;

    if (groupByUserIdData[i] !== undefined) {
      for (let j = 0; j < groupByUserIdData[i].length; j++) {
        if (groupByUserIdData[i][j].pair === "BTC/USDT") {
          btc += groupByUserIdData[i][j].coin1;
          usdt += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "ETH/USDT") {
          eth += groupByUserIdData[i][j].coin1;
          usdt += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "ZNX/USDT") {
          znx += groupByUserIdData[i][j].coin1;
          usdt += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "NXV/USDT") {
          nxv += groupByUserIdData[i][j].coin1;
          usdt += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "BNB/USDT") {
          bnb += groupByUserIdData[i][j].coin1;
          usdt += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "ZNX/ETH") {
          znx += groupByUserIdData[i][j].coin1;
          eth += groupByUserIdData[i][j].coin2;
        } else if (groupByUserIdData[i][j].pair === "NXV/ETH") {
          nxv += groupByUserIdData[i][j].coin1;
          eth += groupByUserIdData[i][j].coin2;
        }
      }
    }
    if (groupByUserIdOrderList[i] !== undefined) {
      for (let j = 0; j < groupByUserIdOrderList[i].length; j++) {
        if (groupByUserIdOrderList[i][j].pair === "BTC/USDT") {
          btc += groupByUserIdOrderList[i][j].coin1;
          usdt += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "ETH/USDT") {
          eth += groupByUserIdOrderList[i][j].coin1;
          usdt += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "ZNX/USDT") {
          znx += groupByUserIdOrderList[i][j].coin1;
          usdt += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "NXV/USDT") {
          nxv += groupByUserIdOrderList[i][j].coin1;
          usdt += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "BNB/USDT") {
          bnb += groupByUserIdOrderList[i][j].coin1;
          usdt += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "ZNX/ETH") {
          znx += groupByUserIdOrderList[i][j].coin1;
          eth += groupByUserIdOrderList[i][j].coin2;
        } else if (groupByUserIdOrderList[i][j].pair === "NXV/ETH") {
          nxv += groupByUserIdOrderList[i][j].coin1;
          eth += groupByUserIdOrderList[i][j].coin2;
        }
      }
    }

    newArray.push({
      userId: i,
      btc: btc,
      bnb: bnb,
      eth: eth,
      usdt: usdt,
      nxv: nxv,
      znx: znx,
    });
  }

  // compair between db data and calculated value
  var users = await getAllUsers();
  var result = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < newArray.length; j++) {
      if (users[i].Id === newArray[j].userId) {
        if (
          users[i].Balance.BNB === newArray[j].bnb &&
          users[i].Balance.BTC === newArray[j].btc &&
          users[i].Balance.ETH === newArray[j].eth &&
          users[i].Balance.NXV === newArray[j].nxv &&
          users[i].Balance.USDT === newArray[j].usdt &&
          users[i].Balance.ZNX === newArray[j].znx
        ) {
          result.push({ userId: newArray[j].userId, balance: true });
        } else {
          result.push({ userId: newArray[j].userId, balance: false });
        }
        break;
      }
    }
  }

  // save the compaired result to file
  fs.writeFileSync(
    __dirname + "/../data/trade-check/userBalanceInfoByPair.json",
    JSON.stringify(newArray, null, "\t")
  );

  fs.writeFileSync(
    __dirname + "/../data/trade-check/result.json",
    JSON.stringify(result, null, "\t")
  );
};

main();
