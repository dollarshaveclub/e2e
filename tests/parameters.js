
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

exports.parameters = [
  {
    url: 'https://github.com/',
  },
  {
    url: 'https://www.nytimes.com/',
  },
]

exports.test = ({ driver, step, parameters }) => {
  step(`load ${parameters.url}`, async () => {
    await driver.get(parameters.url)
  }, {
    timeout: '30s',
  })
}
