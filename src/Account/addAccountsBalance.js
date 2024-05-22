const axios = require("axios");
const fs = require("fs");
var FormData = require("form-data");

const { backend } = require("../config/config");

const getAllUsers = async () => {
  var endpoint = backend + "/users/list";

  let res = await axios.post(endpoint);

  if (res.data !== undefined) {
    if (res.data.Success) {
      users = res.data.Data;
      return users;
    } else {
      console.error(
        "Get all users from api-server failed." + JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

//Get coinpair list
const getAllCoins = async () => {
  var endpoint = backend + "/coinpair/list";

  let res = await axios.post(endpoint);

  if (res.data !== undefined) {
    if (res.data.Success) {
      coinpairs = res.data.Data;
      var temp = [];
      for (let i = 0; i < coinpairs.length; i++) {
        temp.push(coinpairs[i].Pair.split("/")[0]);
        temp.push(coinpairs[i].Pair.split("/")[1]);
      }

      var coins = [...new Set(temp)];

      return coins;
    } else {
      console.log(
        "Get all coin pairs from api-server failed." +
          JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

const main = async () => {
  coins = await getAllCoins();

  users = await getAllUsers();

  if (!users) {
    process.exit();
  }

  var endpoint = backend + "/users/set_balance";
  var successData = [],
    failedData = [];

  console.log("start");

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < coins.length; j++) {
      var formData = new FormData();
      formData.append("user_id", users[i].Id);
      formData.append("symbol", coins[j]);
      formData.append("amount", 10000000);
      const formHeaders = formData.getHeaders();

      axios
        .post(endpoint, formData, {
          headers: {
            ...formHeaders,
          },
        })
        .then((res) => {
          if (res.data.Success) {
            successData.push({
              success: true,
              userId: users[i].Id,
              coin: coins[j],
            });
          } else {
            failedData.push({
              success: true,
              userId: users[i].Id,
              coin: coins[j],
            });
          }
        })
        .catch((err) => {
          console.log("failed", err.message);
        })
        .then(() => {
          if (
            successData.length + failedData.length ===
            users.length * coins.length
          ) {
            fs.writeFileSync(
              __dirname + "/../data/account/addingBalanceResult.json",
              JSON.stringify(
                {
                  successData: successData,
                  failedData: failedData,
                  successCnt: successData.length,
                  failedCnt: failedData.length,
                },
                null,
                "\t"
              )
            );
            console.log("finish");
          }
        });
    }
  }
};

main();
