
const debug = require('debug')('dsc-e2e:tests:google')

exports.options = {
  retries: 1,
  clients: [
    {
      browser: 'chrome',
    },
    {
      browser: 'edge',
    },
  ],
}

exports.description = `
Just load https://google.com.
`

exports.test = ({ driver, step }) => {
  step('load google.com', async () => {
    debug('loading google')
    await driver.get('https://google.com')
    debug('loaded google')
  }, {
    timeout: '30s',
  })

  step.skip('skip this step', async () => {
    throw new Error('not implemented')
  }, '10s')
}
