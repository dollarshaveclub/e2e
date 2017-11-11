
const { promise } = require('selenium-webdriver')

// because apparently selenium-webdriver's implementation sucks
// https://github.com/SeleniumHQ/selenium/issues/3037
promise.USE_PROMISE_MANAGER = false
