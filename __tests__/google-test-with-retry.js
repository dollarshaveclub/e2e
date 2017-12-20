
const assert = require('assert')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('google w/ default options', async () => {
  const tests = findTests(['tests/google-with-retry.js'])
  const runner = runTests(tests, {})
  const results = await runner.exec()
  assert(results.every(x => x.success))
  assert.equal(1, results.length)
  const [result] = results
  assert.deepEqual([false, true], result.results.map(x => x.success))
})
