//command description
const accountArgs = require("yargs/yargs")(process.argv.slice(2))
  .default({
    count: 30,
  })
  .usage("Usage: $0 --count [int]")
  .example(
    "node ./$0 --count 200",
    "create 200 accounts randomly by calling signup api"
  )
  .example(
    "npm run create-account -- --count 200",
    "create 200 accounts randomly by calling signup api"
  )
  .demandOption(["count"])
  .alias("count", "count-of-account")
  .help("h")
  .alias("h", "help")
  .epilog("copyright 2021").argv;

//command description
const orderArgs = require("yargs/yargs")(process.argv.slice(2))
  .default({
    // interval: 1000,
    user: 100,
  })
  .usage("Usage: $0 --user [int]")
  .example(
    "node ./$0 --interval 1000 --user 200",
    "limit user count to take part in buy order and set interval for sending buy order interval as 1000ms"
  )
  .example(
    "npm run buy-order -- --interval 1000 --user 200",
    "limit user count to take part in buy order and set interval for sending buy order interval as 1000ms"
  )
  .demandOption(["user"])
  .alias("user", "user-limit")
  .help("h")
  .alias("h", "help")
  .epilog("copyright 2021").argv;

module.exports = { accountArgs, orderArgs };
