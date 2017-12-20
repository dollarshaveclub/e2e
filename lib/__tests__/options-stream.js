
const assert = require('assert')

const RunTests = require('../run-tests')

test('concurrency=undefined', () => {
  const runner = new RunTests([], {})

  assert(runner.options.stream)
})

test('concurrency=1', () => {
  const runner = new RunTests([], {
    concurrency: 1,
  })

  assert(runner.options.stream)
})

test('concurrency=5', () => {
  const runner = new RunTests([], {
    concurrency: 5,
  })

  assert(!runner.options.stream)
})
