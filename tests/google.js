
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
  ]
}

exports.parameters = {
  query: 'how to google things',
}

exports.test = ({ driver, options, parameters, step }) => {
  step('load google.com', async () => {

  })

  step(`search ${parameters.query}`, async () => {

  })

  step(`find a result`, async () => {

  })
}
