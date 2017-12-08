#!/usr/bin/env node

/* eslint no-console: 0 */

const program = require('commander')
  .version(require('../package.json').version)
  .usage('[options] <tests>')
  .option('--headless', 'run local tests headlessly')
  .option('-s, --sauce', 'run Sauce Labs tests')
  .option('-so, --sauce-only', 'only run tests on Sauce Labs')
  .option('-b, --browsers <names>', 'only run tests specified for these browsers')
  .option('-ib', '--ignore-browsers <names>', 'ignore running tests for these browsers')
  .option('-c, --concurrency <n>', 'test concurrency', parseInt)
  .option('-lc, --local-concurrency <n>', 'local test concurrency', parseInt)
  .option('-sc, --sauce-concurrency <n>', 'Sauce Labs test concurrency', parseInt)
  .parse(process.argv)

const debug = require('debug')('dsc-monitor:bin')
const path = require('path')

const findTests = require('../lib/find-tests')
const runTests = require('../lib')

const tests = findTests(program.args)

const options = {}
if (program.concurrency && !isNaN(program.concurrency)) options.concurrency = program.concurrency
if (program.headless) options.headless = true
if (program.sauce) options.sauce = true
if (program.sauceOnly) {
  options.sauce = true
  options.local = false
}
if (program.browsers) options.browsers = program.browsers.split(',').map(trim).filter(Boolean)
if (program.ignoreBrowsers) options.ignoreBrowsers = program.ignoreBrowsers.split(',').map(trim).filter(Boolean)

const runner = runTests(tests, options)

if (program.plugin) {
  const plugin = require(path.resolve(program.plugin))
  plugin(runner)
}

runner.exec().then((results) => {
  debug('%o', results)
  if (results.every(result => result.success)) {
    process.exitCode = 0
    return
  }

  process.exitCode = 1
}).catch((err) => {
  console.error(err.stack)
  process.exitCode = 1
})

function trim (x) {
  return x.trim()
}
