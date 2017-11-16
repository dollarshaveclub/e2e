
const SauceLabs = require('saucelabs')

exports.SAUCE_USERNAME = process.env.SAUCE_USERNAME || process.env.SAUCE_USER || 'dollarshaveclub'
exports.SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_KEY

const saucelabs = new SauceLabs({
  username: exports.SAUCE_USERNAME,
  password: exports.SAUCE_ACCESS_KEY,
})

// example: https://github.com/ndmanvar/JS-Mocha-WebdriverJS/blob/master/tests/sample-spec.js#L47-L50
exports.updateSauceJob = (sessionId, data) => new Promise((resolve, reject) => {
  saucelabs.updateJob(sessionId, data, (err) => {
    if (err) reject(err)
    resolve()
  })
})

exports.createSauceName = (context) => {
  return `${context.test.id} ${context.test.options.client.browser.name}`
}
