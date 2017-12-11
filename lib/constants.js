
const assert = require('assert')
const os = require('os')

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
    local: !process.env.CI, // TODO: support it in CircleCI once they support it
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
    platform: 'macOS 10.13',
    local: os.platform() === 'darwin',
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
  stepTimeout: '30s',
  stepSlowThreshold: '5s',
  retries: 1,
  retryWithSauceLabs: true,
  clients: [
    {
      browser: 'chrome',
    },
  ],
}

exports.TEST_OPTIONS_CLIENT_DEFAULTS = {
  browser: 'chrome',
  width: 1280,
  height: 960,
}

exports.TEST_OPTIONS_CLIENT_PLATFORM_DEFAULTS = {
  width: 1280,
  height: 960,
  platform: 'Windows 10',
}

exports.TEST_MODES = {
  headless: 'headless',
  sauce: 'sauce',
  local: 'local',
}
