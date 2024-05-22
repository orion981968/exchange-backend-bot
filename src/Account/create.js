const axios = require("axios");
const fs = require("fs");
var randomEmail = require("random-email");
var generator = require("generate-password");
var FormData = require("form-data");

//import configs
const { accountArgs } = require("../config/args");
const constants = require("../config/consts");
const { backend } = require("../config/config");

//account count from cmd argument; default: 200
var count = accountArgs.count;

//create multiple passwords at once
var passwords = generator.generateMultiple(count, {
  length: 10,
  numbers: false,
});

//create multiple random accounts
const createRandomAccounts = (count) => {
  var accounts = [];
  for (let i = 0; i < count; i++) {
    let account = {
      email: randomEmail({ domain: constants.emailDomain }),
      password: passwords[i],
      confirmpassword: passwords[i],
    };
    accounts.push(account);
  }
  return accounts;
};

var randomAccounts = createRandomAccounts(count);

var successfulAccounts = [],
  failedAccounts = [],
  errorAccounts = [];

for (let i = 0; i < randomAccounts.length; i++) {
  var formData = new FormData();
  formData.append("email", randomAccounts[i].email);
  formData.append("password", randomAccounts[i].password);
  formData.append("confirmpassword", randomAccounts[i].confirmpassword);

  // In Node.js environment you need to set boundary in the header field 'Content-Type' by calling method `getHeaders`
  const formHeaders = formData.getHeaders();

  var endpoint = backend + "/users/signup";

  axios
    .post(endpoint, formData, {
      headers: {
        ...formHeaders,
      },
    })
    .then((res) => {
      if (res.data.Success) {
        console.log("success true");
        successfulAccounts.push(randomAccounts[i]);
      } else {
        console.log("success false");
        failedAccounts.push(randomAccounts[i]);
      }
    })
    .catch((err) => {
      console.log("failed", err.message);
      errorAccounts.push(randomAccounts[i]);
    })
    .then(() => {
      if (
        successfulAccounts.length +
          failedAccounts.length +
          errorAccounts.length ===
        randomAccounts.length
      ) {
        fs.writeFileSync(
          __dirname + "/../data/account/successfulAccounts.json",
          JSON.stringify(successfulAccounts, null, "\t")
        );
        fs.writeFileSync(
          __dirname + "/../data/account/failedAccounts.json",
          JSON.stringify(failedAccounts, null, "\t")
        );
        fs.writeFileSync(
          __dirname + "/../data/account/errorAccounts.json",
          JSON.stringify(errorAccounts, null, "\t")
        );

        console.log("finish");
        process.exit();
      }
    });
}

console.log("start");
