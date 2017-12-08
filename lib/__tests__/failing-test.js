
const assert = require('assert')

const findTests = require('../find-tests')
const runTests = require('..')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('google w/ default options', async () => {
  const tests = findTests(['tests-failing/failing.js'])
  const runner = runTests(tests, {})
  const results = await runner.exec()
  assert(results.every(x => !x.success))
})
