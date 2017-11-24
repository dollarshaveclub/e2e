
const assert = require('assert')

const { TEST_MODES } = require('./constants')
const {
  BROWSERS,
} = require('./constants')

exports.lookupBrowser = function lookupBrowser (name) {
  if (BROWSERS[name]) return BROWSERS[name]
  for (const key of Object.keys(BROWSERS)) {
    const BROWSER = BROWSERS[key]
    if (BROWSER.name === name) return BROWSER
    for (const alias of BROWSER.aliases) {
      if (alias === name) {
        return BROWSER
      }
    }
  }
  throw new Error(`Unknown browser: ${name}`)
}

exports.validateTestContext = function validateTestContext (context) {
  assert(context.test)
  assert(context.runnerOptions)
  assert(context.env)
  assert(!Array.isArray(context.parameters))
  assert(context.mode)

  assert(TEST_MODES[context.mode], `Invalid test mode: ${context.mode}`)
  assert(context.test.options)
  assert(context.test.test)
  assert.equal('function', typeof context.test.test)
}
