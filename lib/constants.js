
const assert = require('assert')

exports.BROWSERS = {
  edge: {
    name: 'MicrosoftEdge',
    platform: 'Windows 10',
    local: false,
    sauce: true,
    headless: false,
    enabled: true,
    aliases: [],
  },
  chrome: {
    name: 'chrome',
    local: true,
    sauce: true,
    headless: true,
    enabled: true,
    aliases: [],
  },
  firefox: {
    name: 'firefox',
    local: false, // TODO: make local once it works locally
    sauce: true,
    headless: false,
    enabled: true,
    aliases: [
      'ff',
    ],
  },
  ie: {
    name: 'internet explorer',
    platform: 'Windows 10',
    local: false,
    sauce: true,
    headless: false,
    enabled: true,
    aliases: [],
  },
  safari: {
    name: 'safari',
    platform: 'macOS 10.12',
    local: false,
    sauce: true,
    headless: false,
    enabled: true,
    aliases: [],
  },
}

Object.keys(exports.BROWSERS).forEach((name) => {
  const BROWSER = exports.BROWSERS[name]
  BROWSER.aliases.push(name)
  assert.equal('boolean', typeof BROWSER.local)
  assert.equal('boolean', typeof BROWSER.sauce)
  assert.equal('boolean', typeof BROWSER.headless)
  assert.equal('boolean', typeof BROWSER.enabled)
})

exports.TEST_OPTIONS_DEFAULTS = {
  driverTimeout: '90s',
  stepTimeout: '30s',
  retries: 1,
  retryWithSauceLabs: true,
  clients: [
    {
      browser: 'chrome',
    },
  ],
}

// defaults per client
exports.TEST_OPTIONS_PLATFORM_DEFAULTS = {
  width: 1280,
  height: 960,
  platform: 'Windows 10',
}
