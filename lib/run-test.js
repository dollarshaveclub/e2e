const chrome = require('selenium-webdriver/chrome')
const debug = require('debug')('e2e:lib:run-test')
const { Builder } = require('selenium-webdriver')

require('./selenium-webdriver-fix')
const {
  createSauceLabName,
  updateSauceJob,
  SAUCE_USERNAME,
  SAUCE_ACCESS_KEY,
} = require('./saucelabs')
const {
  createTimeoutError,
  ms,
  sleep,
} = require('./utils')

const NO_QUIT = !!process.env.NO_QUIT

module.exports = class RunTest {
  constructor (context) {
    this.context = Object.assign({}, context)
  }

  async exec () {
    const { context } = this
    const { run, results } = this.setupTest()

    // run a timeout on the entire step
    await run()

    const success = results.every(result => result.success)

    if (context.sauceLabs) {
      await updateSauceJob(context.sauceLabs.session_id, {
        passed: success,
      })
    }

    await this.quitDriver()

    return {
      context,
      results,
      success: true,
      elapsedTime: this.getElapsedTime(),
    }
  }

  createDriver (step) {
    const { context } = this
    const { client, location } = context

    if (location === 'sauce') {
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

    if (client.browser.name === 'chrome' && location === 'headless') {
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
    if (NO_QUIT) return

    await this._quitDriver(driver)
  }

  async _quitDriver (driver) {
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
    const results = this.results = []
    const { context } = this
    const steps = []

    function step (name, fn, _options) {
      const options = typeof _options === 'number' || typeof _options === 'string'
        ? { timeout: _options }
        : _options || {}
      const timeout = options.timeout
        ? ms(options.timeout)
        : context.options.stepTimeout

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

    context.test.fn(context)

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

        // TODO: hrtime
        const start = Date.now()

        try {
          await Promise.race([
            fn(),
            this.getTimeoutPromise(name, timeout),
          ])
          result.success = true
        } catch (err) {
          result.success = false
          result.error = err
          return
        } finally {
          // TODO: hrtime
          result.elapsedTime = Date.now() - start
          debug(`${key} — finished`)
        }
      }
    }

    return {
      run,
      results,
    }
  }

  getTimeoutPromise (name, timeout) {
    return sleep(timeout).then(() => {
      throw createTimeoutError(`Test "${this.context.test.id}" step "${name}" timed out!`)
    })
  }
}
