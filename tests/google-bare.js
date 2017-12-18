
exports.test = ({ driver, step }) => {
  step('load google.com', async () => {
    await driver.get('https://google.com')
  })
}
