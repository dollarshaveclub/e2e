
const debug = require('debug')('dsc-e2e:lib:run-test-with-retry')
const RunTest = require('./run-test')
const {
  getElapsedTime,
} = require('./utils')

module.exports = class RunTestWithRetry {
  constructor (context, eventsEmitter) {
    this.eventsEmitter = eventsEmitter
    this.context = context
  }

  async exec () {
    const { context } = this
    const {
      mode,
      test: {
        options: {
          driver,
          retries,
          retryWithSauceLabs,
        },
      },
      runnerOptions: {
        sauce,
      },
      testId,
      stepName,
    } = context

    const start = process.hrtime()
    let sauceContext = null
    let attempt = 0
    const results = []

    // run the test until it passes
    while (attempt++ <= retries) {
      const result = await new RunTest(context, { attempt }, this.eventsEmitter).exec()
      results.push(result)
      if (result.success) break
    }

    // if the test has been failing locally, try to run it one last time in sauce labs
    if (driver === 'selenium' && sauce && retryWithSauceLabs && mode !== 'sauce' && results.some(x => !x.success)) {
      debug('retrying in saucelabs')
      sauceContext = Object.assign({}, context, {
        mode: 'sauce',
      })
      const result = await new RunTest(sauceContext, { attempt }).exec()
      results.push(result)
    }

    const success = results.some(x => x.success)

    success && this.eventsEmitter.emit('run-step.success', { testId, stepName })

    return {
      context,
      sauceContext,
      results,
      success,
      elapsedTime: getElapsedTime(start),
    }
  }
}
