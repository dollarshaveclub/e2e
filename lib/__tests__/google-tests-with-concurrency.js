
const assert = require('assert')

const findTests = require('../find-tests')
const runTests = require('..')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

test('google w/ default options', async () => {
  const tests = findTests(['tests/google.js'])
  const runner = runTests(tests, {
    sauce: true,
    localConcurrency: 1,
    sauceConcurrency: 1,
  })
  const results = await runner.exec()
  assert(results.every(x => x.success))
})
