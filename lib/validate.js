
const {
  BROWSERS,
} = require('./constants')

exports.lookupBrowser = function lookupBrowser (name) {
  if (BROWSERS[name]) return BROWSERS[name]
  for (const key of Object.keys(BROWSERS)) {
    const BROWSER = BROWSERS[key]
    if (BROWSER.name === name) return BROWSER
    for (const alias of BROWSER.aliases) {
      if (alias === name) {
        return BROWSER
      }
    }
  }
  throw new Error(`Unknown browser: ${name}`)
}
