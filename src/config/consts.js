const axios = require("axios");
const { backend } = require("../config/config");

var dateObj = new Date();
var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate();
var year = dateObj.getUTCFullYear();

const today = year.toString() + month.toString() + day.toString();
module.exports = Object.freeze({
  emailDomain: "day" + today + ".com",
});

//random mix array
const shuffle = (array) => {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

//Get coinpair list
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

const getRandomSelectedUsers = async (selectedUserCnt) => {
  var endpoint = backend + "/users/list";

  let res = await axios.post(endpoint);

  if (res.data !== undefined) {
    if (res.data.Success) {
      users = res.data.Data;
      if (users.length >= selectedUserCnt)
        return shuffle(users).slice(0, selectedUserCnt);
      else {
        console.error(
          "There are enough users to select. Please rest the number of users."
        );
        return null;
      }
    } else {
      console.error(
        "Get all users from api-server failed." + JSON.stringify(res.data.Error)
      );
      return null;
    }
  }
};

const createRandomPrice = (avg) => {
  let max = Math.floor(avg + avg / 3);
  let min = Math.ceil(avg - avg / 3);
  return Math.floor(Math.random() * (max - min) + min);
};

module.exports = {
  getRandomSelectedUsers,
  getAllCoinPairs,
  createRandomPrice,
};
