const debug = require('debug')('dsc-e2e:lib:run-test')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')
const assert = require('assert')
const chalk = require('chalk')

require('./selenium-webdriver-fix')
const {
  updateSauceJob,
  SAUCE_USERNAME,
  SAUCE_ACCESS_KEY,
} = require('./saucelabs')
const {
  createTimeoutError,
  toMS,
  sleep,
  getElapsedTime,
  logElapsedTime,
  isPromise,
} = require('./utils')

module.exports = class RunTest {
  constructor (context, { attempt }) {
    this.context = context
    this.parameters = context.parameters // to access parameters from exports.test
    this.attempt = attempt
    this.results = []
    this.steps = []
    this.logs = []

    this.step = this.createStep()
    this.log = this.createLogger()
  }

  // internal logging
  _log (str) {
    if (this.context.runnerOptions.stream) console.log(str)
    else this.logs.push(str)
  }

  createLogger () {
    const space = '      '
    return (str) => this._log(space + str.replace(/\n/g, '\n' + space))
  }

  // returns the output of the test
  async exec () {
    const { context, results, logs, parameters } = this
    const start = process.hrtime()

    const logContext = {
      browser: context.test.options.client.browser.name,
      mode: context.mode,
      attempt: this.attempt,
    }

    this._log(`${context.test.filename}:`)
    this._log(`  config:`)
    Object.keys(logContext).forEach((key) => {
      this._log(`    ${key}: ${logContext[key]}`)
    })

    if (parameters) {
      this._log(`  parameters:`)
      Object.keys(parameters).forEach((key) => {
        this._log(`    ${key}: ${parameters[key]}`)
      })
    }

    this._log('  steps:')

    await this.runTest()

    const success = results.every(result => result.skip || result.success)

    const elapsedTime = getElapsedTime(start)
    const time = chalk.green(`(${logElapsedTime(elapsedTime)})`)
    this._log(`  ${success ? chalk.green('✔') : chalk.red('✕')} ${time}`)
    this._log('')

    if (!context.runnerOptions.stream) console.log(this.logs.join('\n'))

    return {
      logs,
      context,
      results,
      success,
      elapsedTime,
    }
  }

  // runs the test
  async runTest () {
    const { context, steps } = this

    if (await this.createDriver() !== false) {
      // initialize the test
      const result = context.test.test(this, context)
      assert(!isPromise(result), 'Test functions should not be async!')

      // run the test steps
      for (const step of steps) {
        const r = await this.runStep(step)
        if (r === false) break
      }
    }

    await this.quitDriver()
    await this.updateSauceLabs()

    debug(this.results)
  }

  // create the driver based on our 3 modes
  createDriver () {
    const {
      mode,
      test: {
        options: {
          client,
        },
      },
    } = this.context

    if (mode === 'sauce') return this.createSauceLabsDriver()
    if (client.browser.name === 'chrome' && mode === 'headless') return this.createHeadlessChromeDriver()
    return this.createSeleniumDriver()
  }

  createSauceLabsDriver () {
    const { context } = this
    const {
      test: {
        options: {
          client,
        },
      },
    } = context

    return this.runStep({
      name: 'create Sauce Labs session',
      fn: async ({ log }) => {
        const sauceName = context.runnerOptions.createSauceName(context)
        assert.equal(typeof sauceName, 'string')
        const capabilities = {
          name: sauceName,
          browserName: client.browser.name,
          platform: client.platform.name,
          version: 'latest',
          screenResolution: `${client.platform.width}x${client.platform.height}`,
          username: SAUCE_USERNAME,
          accessKey: SAUCE_ACCESS_KEY,
        }
        debug('capabilities: %o', capabilities)
        const driver = this.driver = new Builder()
          .withCapabilities(capabilities)
          .usingServer(`https://${SAUCE_USERNAME}:${SAUCE_ACCESS_KEY}@ondemand.saucelabs.com/wd/hub`)
          .build()

        const session = await driver.getSession()

        context.sauce = {
          name: sauceName,
          session_id: session.id_,
        }

        const link = chalk.bold(`https://saucelabs.com/beta/tests/${context.sauce.session_id}/commands`)
        log(`Sauce Labs link: ${link}`)
      },
      // if you hit the concurrency limit, sauce waits 90s before killing ur job
      timeout: toMS('90s'),
    })
  }

  createHeadlessChromeDriver () {
    const { client } = this.context.test.options

    return this.runStep({
      name: 'setup headless Chrome driver',
      fn: async () => {
        const builder = await new Builder().forBrowser(client.browser.name)
        builder.setChromeOptions(new chrome.Options().addArguments(
          '--headless',
          '--disable-extensions',
          '--disable-gpu',
          `--window-size=${client.width}x${client.height}`
        ))
        this.driver = await builder.build()
      },
      timeout: toMS('30s'),
    })
  }

  createSeleniumDriver () {
    const { client } = this.context.test.options

    return this.runStep({
      name: 'setup Chrome driver',
      fn: async () => {
        const builder = await new Builder().forBrowser(client.browser.name)
        const driver = this.driver = await builder.build()
        await driver.manage().window().setSize(client.width, client.height)
      },
      timeout: toMS('30s'),
    })
  }

  // quits the driver if it exists
  quitDriver () {
    return this.runStep({
      name: 'quit the Selenium driver',
      fn: async () => {
        const { driver } = this
        if (!driver) return
        // don't fail the test if we fail to quit the driver
        try {
          debug('quiting driver')
          await driver.quit()
          debug('quit the driver')
        } catch (err2) {
          console.error('Experienced an error quitting the driver. Ignoring.')
          debug(err2.stack || err2)
        }
      },
      timeout: toMS('15s'),
    })
  }

  // updates the sauce labs status of this test
  updateSauceLabs () {
    const { context, results } = this
    if (!context.sauce) return

    debug('setting sauce status based on results: %o', results)

    return this.runStep({
      name: 'update Sauce Labs session metadata',
      fn: async () => {
        await updateSauceJob(context.sauce.session_id, {
          // it checks its own `result.success`, which is currently `undefined`
          // so we have to check that it's not successful
          passed: results.every(result => result.skip || result.success !== false),
        })
      },
      timeout: toMS('15s'),
    })
  }

  // runs a step
  async runStep ({ name, fn, skip, timeout }) {
    const { context, results, log } = this
    const key = `${context.test.id} "${name}"`
    debug(`${key} — starting`)

    const result = {
      name,
      skip: !!skip,
    }

    results.push(result)

    if (skip) return

    const start = process.hrtime()

    try {
      await Promise.race([
        fn({ log }),
        this.createStepTimeoutPromise(name, timeout),
      ])
      result.success = true
    } catch (err) {
      debug(err)
      log(chalk.red(err.stack || err))
      result.success = false
      result.error = err
      return false // SKIP
    } finally {
      // TODO: hrtime
      result.elapsedTime = getElapsedTime(start)
      const time = chalk.green(`(${logElapsedTime(result.elapsedTime)})`)
      this._log(`    ${result.success ? chalk.green('✔') : chalk.red('✕')} ${name} ${time}`)
      debug(`${key} — finished`)
    }
  }

  // create the step function at RunTest initialization
  createStep () {
    const step = (name, fn, _options) => {
      const options = typeof _options === 'number' || typeof _options === 'string'
        ? { timeout: _options }
        : _options || {}
      const timeout = options.timeout
        ? toMS(options.timeout)
        : toMS(this.context.test.options.stepTimeout)

      this.steps.push({
        name,
        fn,
        timeout,
      })
    }

    step.skip = (name, fn) => {
      this.steps.push({
        name,
        fn,
        skip: true,
      })
    }

    return step
  }

  createStepTimeoutPromise (name, timeout) {
    return sleep(timeout).then(() => {
      throw createTimeoutError(`Test "${this.context.test.id}" step "${name}" timed out!`)
    })
  }
}
