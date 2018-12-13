const debug = require('debug')('dsc-e2e:lib:run-test')
const chrome = require('selenium-webdriver/chrome')
const { Builder } = require('selenium-webdriver')
const puppeteer = require('puppeteer')
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

    this._beforeAll = []
    this._beforeTest = []
    this._beforeEach = []
    this._step = []
    this._afterEach = []
    this._afterTest = []
    this._afterAll = []
    this._logs = []

    this.beforeAll = this.createStep('beforeAll')
    this.beforeTest = this.createStep('beforeTest')
    this.beforeEach = this.createStep('beforeEach')
    this.step = this.createStep('step')
    this.afterEach = this.createStep('afterEach')
    this.afterTest = this.createStep('afterTest')
    this.afterAll = this.createStep('afterAll')
    this.log = this.createLogger()
  }

  // internal logging without space manipulation
  _log (str) {
    if (this.context.runnerOptions.stream) console.log(str)
    else this._logs.push(str)
  }

  createLogger () {
    const space = '      '
    return (str) => this._log(space + str.replace(/\n/g, '\n' + space))
  }

  // returns the output of the test
  async exec () {
    const { context, results, parameters } = this
    const start = process.hrtime()

    const { test } = context
    if (typeof test.beforeAll === 'function') test.beforeAll.call(this, this.beforeAll)
    if (typeof test.afterAll === 'function') test.afterAll.call(this, this.afterAll)

    const { driver, client } = test.options

    // TODO: log more of the client
    const logContext = {
      driver,
      mode: context.mode,
      browser: client.browser.name,
      '  width': client.width,
      '  height': client.height,
      attempt: this.attempt > 1 ? chalk.bold(chalk.red(this.attempt)) : this.attempt,
    }

    let { description } = context.test
    if (typeof description === 'function') description = description.call(this)

    if (description && typeof description === 'string') {
      this._log(`${chalk.underline(context.test.filename)}: ${description.trim()}`)
    } else {
      this._log(`${chalk.underline(context.test.filename)}:`)
    }

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
    const time = `(${logElapsedTime(elapsedTime)})`
    this._log(`  ${chalk.bold(success ? chalk.green('✔ PASS ' + time) : chalk.red('✕ FAIL ' + time))}`)
    this._log('')

    if (!context.runnerOptions.stream) console.log(this._logs.join('\n'))

    return {
      context,
      results,
      success,
      elapsedTime,
    }
  }

  // runs the test
  async runTest () {
    await this.runTestSteps()
    await this.quitDriver()
    await this.updateSauceLabs()

    for (const afterAll of this._afterAll) {
      if (await this.runStep(afterAll) === false) break
    }

    debug(this.results)
  }

  async runTestSteps () {
    const { context, _step } = this
    const { test } = context

    for (const beforeAll of this._beforeAll) {
      if (await this.runStep(beforeAll) === false) return
    }

    if (await this.createDriver() === false) return

    // initialize the test
    // must be ran after the driver is initialized because it depends on `driver`
    const result = test.test(this, context)
    assert(!isPromise(result), 'Test functions should not be async!')

    for (const beforeTest of this._beforeTest) {
      if (await this.runStep(beforeTest) === false) return
    }

    // run the test steps
    for (const step of _step) {
      for (const beforeEach of this._beforeEach) {
        if (await this.runStep(beforeEach) === false) return
      }
      if (await this.runStep(step) === false) return
      for (const afterEach of this._afterEach) {
        if (await this.runStep(afterEach) === false) return
      }
    }

    for (const afterTest of this._afterTest) {
      if (await this.runStep(afterTest) === false) return
    }
  }

  // create the driver based on our 3 modes
  createDriver () {
    const {
      mode,
      test: {
        options: {
          client,
          driver,
        },
      },
    } = this.context

    if (driver === 'puppeteer') return this.createPuppeteerBrowser()
    if (mode === 'sauce') return this.createSauceLabsDriver()
    if (client.browser.name === 'chrome' && mode === 'headless') return this.createHeadlessChromeDriver()
    return this.createSeleniumDriver()
  }

  createPuppeteerBrowser () {
    const {
      mode,
      test: {
        options: {
          client,
        },
      },
    } = this.context

    return this.runStep({
      name: 'setup puppeteer Chrome browser',
      fn: async () => {
        const browser = await puppeteer.launch({
          headless: mode === 'headless',
          args: ['--disable-dev-shm-usage'],
        })
        const page = await browser.newPage()
        await page.setViewport({
          width: client.width,
          height: client.height,
        })
        Object.assign(this, {
          browser,
          page,
        })
      },
      timeout: toMS('30s'),
      slowThreshold: toMS('5s'),
    })
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
      slowThreshold: toMS('15s'),
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
      slowThreshold: toMS('5s'),
    })
  }

  createSeleniumDriver () {
    const { client } = this.context.test.options

    return this.runStep({
      name: `setup Selenium (${client.browser.name}) driver`,
      fn: async () => {
        const builder = await new Builder().forBrowser(client.browser.name)
        const driver = this.driver = await builder.build()
        await driver.manage().window().setSize(client.width, client.height)
      },
      timeout: toMS('30s'),
      slowThreshold: toMS('5s'),
    })
  }

  // quits the driver if it exists
  quitDriver () {
    const { driver } = this.context.test.options
    if (driver === 'puppeteer') return this.quitPuppeteerBrowser()
    return this.quitSeleniumDriver()
  }

  quitPuppeteerBrowser () {
    return this.runStep({
      name: 'close the Puppeteer browser',
      fn: async () => {
        const { browser, page } = this
        try {
          debug('quiting driver')
          await page.close()
          await browser.close()
          debug('quit the driver')
        } catch (err2) {
          console.error('Experienced an error quitting the driver. Ignoring.')
          debug(err2.stack || err2)
        }
      },
      timeout: toMS('15s'),
      slowThreshold: toMS('1s'),
    })
  }

  quitSeleniumDriver () {
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
      slowThreshold: toMS('1s'),
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
      slowThreshold: toMS('1s'),
    })
  }

  // runs a step
  async runStep ({ name, fn, skip, timeout, slowThreshold }) {
    const { context, results, log } = this
    const key = `${context.test.id} "${name}"`
    debug(`${key} — starting`)

    const result = {
      name,
      skip: !!skip,
    }

    results.push(result)

    if (skip) {
      this._log(`    ${chalk.gray('—')} ${chalk.gray(name)}`)
      return
    }

    const start = process.hrtime()

    try {
      await Promise.race([
        fn.call(this, { log }),
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
      const elapsedTime = result.elapsedTime = getElapsedTime(start)
      const time = chalk[elapsedTime < slowThreshold ? 'green' : 'yellow'](`(${logElapsedTime(elapsedTime)})`)
      this._log(`    ${result.success ? chalk.green('✔') : chalk.red('✕')} ${name} ${time}`)
      debug(`${key} — finished`)
    }
  }

  // create the step function at RunTest initialization
  createStep (type = 'step') {
    const array = `_${type}`
    const prefix = type === 'step' ? '' : `${chalk.underline(type)}: `
    const step = (name, fn, _options) => {
      assert.equal(typeof name, 'string', `First argument to ${type} must be the name of the step.`)
      const options = typeof _options === 'number' || typeof _options === 'string'
        ? { timeout: _options }
        : _options || {}
      const testOptions = this.context.test.options
      const timeout = options.timeout
        ? toMS(options.timeout)
        : toMS(testOptions.stepTimeout)
      const slowThreshold = options.slowThreshold
        ? toMS(options.slowThreshold)
        : toMS(testOptions.stepSlowThreshold)

      this[array].push({
        name: `${prefix}${name}`,
        fn,
        timeout,
        slowThreshold,
      })
    }

    step.skip = (name, fn) => {
      assert.equal(typeof name, 'string', `First argument to ${type} must be the name of the step.`)
      this[array].push({
        name: `${prefix}${name}`,
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
