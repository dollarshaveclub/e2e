
const { Builder } = require('selenium-webdriver')

async function startFirefox () {
  console.log('creating selenium driver')
  const builder = await new Builder().forBrowser('firefox')
  console.log('building selenium driver')
  const driver = await builder.build()
  console.log(driver)
  console.log('done')
}

startFirefox().then(() => {
  process.exit(0)
}, (err) => {
  console.error(err.stack)
  process.exit(1)
})
