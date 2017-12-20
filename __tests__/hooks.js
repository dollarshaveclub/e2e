
const assert = require('assert')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('hooks w/ default options', async () => {
  const tests = findTests(['tests/hooks.js'])
  const runner = runTests(tests, {})
  const results = await runner.exec()
  assert(results.every(x => x.success))
})
