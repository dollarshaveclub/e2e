
const assert = require('assert')

const { lookupBrowser } = require('../validate')

test('lookupBrowser', () => {
  assert(lookupBrowser('ie'))
  assert(lookupBrowser('internet explorer'))

  assert(lookupBrowser('ff'))
  assert(lookupBrowser('firefox'))

  assert.throws(() => lookupBrowser('asdfasdf'))
})
