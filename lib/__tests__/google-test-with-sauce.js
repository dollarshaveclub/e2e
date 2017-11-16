
const assert = require('assert')

const findTests = require('../find-tests')
const runTests = require('..')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 90000

test('google w/ default options', async () => {
  const tests = findTests(['tests/google.js'])
  const runner = runTests(tests, {
    sauce: true,
  })
  const results = await runner.exec()
  assert(results.every(x => x.success))
})
