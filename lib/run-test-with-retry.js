
const debug = require('debug')('e2e:lib:run-test-with-retry')
const RunTest = require('./run-test')
const {
  getElapsedTime,
} = require('./utils')

module.exports = class RunTestWithRetry {
  constructor (context) {
    this.context = context
  }

  async exec () {
    const { context } = this
    const {
      location,
      options: {
        sauce, // TODO: rename to saucelabs
        retries, // NOTE: retries is 0-index, so need to fix
        retryWithSauceLabs,
      },
    } = context

    const start = process.hrtime()
    let sauceContext = null
    let attempt = 1
    const results = []

    for (; attempt < retries; attempt++) {
      const result = await new RunTest(context, attempt).exec()
      results.push(result)
      if (result.success) break
    }

    if (sauce && results.some(x => x.success) && retryWithSauceLabs && location !== 'sauce') {
      debug('retrying in saucelabs')
      sauceContext = Object.assign({}, context, {
        location: 'sauce',
      })
      const result = await new RunTest(sauceContext, attempt).exec()
      results.push(result)
    }

    return {
      context,
      sauceContext,
      results,
      success: results.some(x => x.success),
      elapsedTime: getElapsedTime(start),
    }
  }
}
