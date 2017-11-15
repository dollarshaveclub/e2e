const debug = require('debug')('dsc-e2e:lib:run-test')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')
const assert = require('assert')

require('./selenium-webdriver-fix')
const {
  createSauceLabName,
  updateSauceJob,
  SAUCE_USERNAME,
  SAUCE_ACCESS_KEY,
} = require('./saucelabs')
const {
  createTimeoutError,
  toMS,
  sleep,
  getElapsedTime,
  isPromise,
} = require('./utils')

module.exports = class RunTest {
  constructor (context, attempt) {
    this.context = context
    this.attempt = attempt
    this.results = []
  }

  async exec () {
    const start = process.hrtime()
    const { context } = this
    const { run, results } = this.setupTest()

    debug('before running')
    await run()
    debug('after running')

    const success = results.every(result => result.success)

    if (context.sauceLabs) {
      await updateSauceJob(context.sauceLabs.session_id, {
        passed: success,
      })
    }

    return {
      context,
      results,
      success: true,
      elapsedTime: getElapsedTime(start),
    }
  }

  createDriver (step) {
    const { context } = this
    const {
      mode,
      test: {
        options: {
          client,
        },
      },
    } = context

    if (mode === 'sauce') {
      let sauceName
      let driver

      step('setup Sauce Labs driver', async () => {
        sauceName = createSauceLabName(context.test.id, context.env) // TODO: check
        driver = this.driver = new Builder()
          .withCapabilities({
            name: sauceName,
            browserName: client.browser.name,
            platform: client.platform.name,
            version: 'latest',
            screenResolution: `${client.platform.width}x${client.platform.height}`,
            username: SAUCE_USERNAME,
            accessKey: SAUCE_ACCESS_KEY,
          })
          .usingServer(`https://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@ondemand.saucelabs.com/wd/hub`)
          .build()
      }, {
        timeout: '90s', // how long Sauce Labs lets you wait
      })

      step('get Sauce Labs session', async () => {
        const session = await driver.getSession()

        context.sauceLabs = {
          name: sauceName,
          session_id: session.id_,
        }
      })

      return
    }

    let builder
    step('setup Chrome builder', async () => {
      builder = await new Builder().forBrowser(client.browser.name)
    }, {
      timeout: '90s',
    })

    if (client.browser.name === 'chrome' && mode === 'headless') {
      step('setup headless Chrome driver', async () => {
        builder.setChromeOptions(new chrome.Options().addArguments(
          '--headless',
          '--disable-extensions',
          '--disable-gpu',
          `--window-size=${client.width}x${client.height}`
        ))
        this.driver = await builder.build()
      }, {
        timeout: '30s',
      })
      return
    }

    step('setup Chrome driver', async () => {
      const driver = this.driver = await builder.build()
      await driver.manage().window().setSize(client.width, client.height)
    }, {
      timeout: '30s',
    })
  }

  async quitDriver () {
    const { driver } = this
    if (!driver) return
    // don't fail the test if we fail to quit the driver
    try {
      await driver.quit()
    } catch (err2) {
      console.error('Experienced an error quitting the driver. Ignoring.')
      debug(err2.stack || err2)
    }
  }

  // sets up all the `step`s
  setupTest () {
    const that = this
    const { context, results, attempt } = this
    const steps = []
    const runContext = {
      step,
      steps,
      results,
      attempt,
      get driver () {
        return that.driver
      },
    }

    function step (name, fn, _options) {
      const options = typeof _options === 'number' || typeof _options === 'string'
        ? { timeout: _options }
        : _options || {}
      const timeout = options.timeout
        ? toMS(options.timeout)
        : toMS(context.test.options.stepTimeout)

      steps.push({
        name,
        fn,
        timeout,
      })
    }

    step.skip = (name, fn) => {
      steps.push({
        name,
        fn,
        skip: true,
      })
    }

    this.createDriver(step)

    const result = context.test.test.call(context, runContext, context)
    assert(!isPromise(result), 'Test functions should not be async!')

    step('quit the driver', async () => {
      await this.quitDriver()
    })

    debug('steps: %o', steps)

    const run = async () => {
      for (const { name, fn, skip, timeout } of steps) {
        const key = `${context.test.id} "${name}"`
        debug(`${key} — starting`)

        const result = {
          name,
          skip: !!skip,
        }

        results.push(result)

        /* eslint no-continue: 0 */
        if (skip) continue

        const start = process.hrtime()

        try {
          await Promise.race([
            fn(),
            this.getTimeoutPromise(name, timeout),
          ])
          result.success = true
        } catch (err) {
          debug(err)
          result.success = false
          result.error = err
          return
        } finally {
          // TODO: hrtime
          result.elapsedTime = getElapsedTime(start)
          debug(`${key} — finished`)
        }
      }
    }

    return {
      run,
      context,
      runContext,
      results,
    }
  }

  getTimeoutPromise (name, timeout) {
    return sleep(timeout).then(() => {
      throw createTimeoutError(`Test "${this.context.test.id}" step "${name}" timed out!`)
    })
  }
}
