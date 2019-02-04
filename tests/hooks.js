
const assert = require('assert')

let values = []

exports.descriptions = `
Test all lifecycle hooks.
`

exports.beforeAll = beforeAll => {
  beforeAll('before all 1', () => {
    values = ['before all 1']
  })

  beforeAll('before all 2', () => {
    assert.strictEqual(values.length, 1)
    assert.deepStrictEqual(values, ['before all 1'])
    values.push('before all 2')
  })
}

exports.afterAll = afterAll => {
  afterAll('after all 1', () => {
    values.push('after all 1')
  })

  afterAll('after all 2', () => {
    assert(values.includes('after all 1'))
    values.push('after all 2')
  })
}

exports.test = ({ driver, step, beforeEach, afterEach, beforeTest, afterTest, afterAll }) => {
  beforeTest('before test 1', () => {

  })

  beforeEach('before each', () => {

  })

  afterEach('after each', () => {

  })

  step('load google.com', async () => {
    await driver.get('https://google.com')
  }, {
    timeout: '30s',
  })

  step('load google.com again', async () => {
    await driver.get('https://google.com')
  }, {
    timeout: '30s',
  })

  afterTest('after test', () => {

  })

  afterAll('after all 3', () => {
    assert(values.includes('after all 1'))
    assert(values.includes('after all 2'))
    values.push('after all 3')
  })
}
