
exports.options = {
  retries: 2,
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

exports.parameters = {
  query: 'how to google things',
}

// NOTE: driver is async, so how would i do this?
exports.test = ({ driver, step }, { parameters }) => {
  step('load google.com', async () => {
    await driver.get('https://google.com')
  })

  step(`search ${parameters.query}`, async () => {

  })

  step(`find a result`, async () => {

  })
}
