
const assert = require('assert')

const findTests = require('../find-tests')
const runTests = require('..')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('failing test', async () => {
  const tests = findTests(['tests-failing/failing.js'])
  const runner = runTests(tests, {
    browsers: ['chrome'],
    sauce: true,
  })
  const results = await runner.exec()
  assert.equal(results.length, 1)
  assert(results.every(x => !x.success))
  const [result] = results
  assert.equal(result.results.length, 3)
  assert.equal(result.results[0].context.mode, 'local')
  assert.equal(result.results[1].context.mode, 'local')
  assert.equal(result.results[2].context.mode, 'sauce')
})
