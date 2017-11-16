
let tried = false
exports.options = {
  retries: 1,
  clients: [
    {
      browser: 'chrome',
    },
    {
      browser: 'firefox',
    },
    {
      browser: 'edge',
    },
    {
      browser: 'safari',
    },
    {
      browser: 'ie',
    },
  ],
}

exports.test = ({ driver, step }) => {
  step('load google.com', async () => {
    if (!tried) {
      tried = true
      throw new Error('boom')
    }

    await driver.get('https://google.com')
  })
}
