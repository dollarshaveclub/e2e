
const debug = require('debug')('dsc-e2e:tests:google-puppeteer')

exports.options = {
  retries: 1,
  driver: 'puppeteer',
}

exports.test = ({ browser, page, step }) => {
  step('load google.com', async () => {
    debug('loading google')
    await page.goto('https://google.com')
    debug('loaded google')
  }, {
    timeout: '30s',
  })
}
