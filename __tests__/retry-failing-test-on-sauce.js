
const assert = require('assert')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('failing test', async () => {
  const tests = findTests(['tests-failing/failing.js'])
  const runner = runTests(tests, {
    browsers: ['chrome'],
    sauce: true,
  })
  const results = await runner.exec()
  assert.strictEqual(results.length, 1)
  assert(results.every(x => !x.success))
  const [result] = results
  assert.strictEqual(result.results.length, 3)
  assert.strictEqual(result.results[0].context.mode, 'local')
  assert.strictEqual(result.results[1].context.mode, 'local')
  assert.strictEqual(result.results[2].context.mode, 'sauce')
})
