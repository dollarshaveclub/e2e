
const assert = require('assert')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('google w/ default options', async () => {
  const tests = findTests(['tests/google-puppeteer.js'])
  const runner = runTests(tests, {
    headless: true,
  })
  const results = await runner.exec()
  assert.equal(1, results.length)
  assert(results.every(x => x.success))
})
