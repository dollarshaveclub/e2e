
const debug = require('debug')('e2e:lib:run-tests')
const pAll = require('p-all')

const runTest = require('./run-test-with-retry')
const { lookupBrowser } = require('./validate')
const { unwind } = require('./utils')
const env = require('./env')

module.exports = class RunTests {
  constructor (tests, _options) {
    this.tests = tests
    this._options = _options
    this.env = env

    const options = this.options = {}

    options.browsers = (_options.browsers || []).map(lookupBrowser)
    options.ignoreBrowsers = (_options.ignoreBrowsers || []).map(lookupBrowser)
    // do not run sauce labs test by default
    options.sauce = !env.DISABLE_SAUCELABS && _options.sauce === true
    // run local tests by default
    options.local = _options.local !== false
    // do not run headless by default
    // headless tests can only be run locally
    // if set, will run browsers in headless mode
    options.headless = options.local && _options.headless === true

    options.concurrency = _options.concurrency || env.concurrency
    options.localConcurrency = _options.localConcurrency || env.localConcurrency
    options.sauceConcurrency = _options.sauceConcurrency || env.sauceConcurrency
    // whether to stream all console output
    options.stream = options.concurrency === 1 && (options.localConcurrency + options.sauceConcurrency) < 1

    // array of all the test functions
    this.allTestFns = []
    this.localTestFns = []
    this.sauceTestFns = []
  }

  async exec () {
    this.setup()

    const { options } = this
    if (options.stream) {
      return pAll(this.tests, {
        concurrency: 1,
      })
    }

    const results = await Promise.all([
      pAll(this.localTests, {
        concurrency: options.localConcurrency || 1,
      }),
      pAll(this.sauceTests, {
        concurrency: options.sauceConcurrency || 1,
      }),
    ])
    return results.reduce((a, b) => a.concat(b), [])
  }

  setupTests () {
    const {
      tests,
      env,
      allTestFns,
      localTestFns,
      sauceTestFns,
    } = this

    tests.forEach((test) => {
      const allTestOptions = unwind(test, {
        clients: 'client',
      }).filter(x => this.filterClient(x.client))

      allTestOptions.forEach((options) => {
        const testLocation = this.getTestLocation(options.client)
        const context = {
          test,
          options,
          env,
          parameters: test.parameters,
          location: testLocation, // TODO: rename to mode
        }

        const testArray = testLocation === 'sauce' ? sauceTestFns : localTestFns

        testArray.push(testFn)
        allTestFns.push(testFn)

        async function testFn () {
          debug('starting %s', test.id)
          const result = await runTest(context, testLocation)
          debug('finished %s', test.id)
          return result
        }
      })
    })
  }

  // removes clients that cannot be run based on the current runner args
  filterClient (client) {
    const { options, browsers, ignoreBrowsers } = this

    // filter tests by browser
    if (browsers && !browsers.some(browser => client.browser.name === browser.name)) return false

    // ignore specific browsers
    if (ignoreBrowsers.some(browser => browser.name === client.browser.name)) return false

    if (options.headless && client.browser.headless) return true
    if (options.local && client.browser.local) return true
    if (options.sauce && client.browser.sauce) return true
    return false
  }

  // based on what parameters you're running tests with
  // and what the client supports, decides which type of test to run
  getTestLocation (client) {
    const { options } = this
    if (options.headless && client.browser.headless) return 'headless'
    if (options.local && client.browser.local) return 'local'
    if (options.sauce && client.browser.sauce) return 'sauce'
    throw new Error(`Unknown test location for client: ${client}`)
  }
}
