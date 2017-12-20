
const assert = require('assert')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

test('run parameters test', async () => {
  const tests = findTests(['tests/parameters.js'])
  const runner = runTests(tests, {})
  const results = await runner.exec()
  assert(results.every(x => x.success))
})
