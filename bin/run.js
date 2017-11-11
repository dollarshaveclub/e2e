#!/usr/bin/env node

/* eslint no-console: 0 */

const program = require('commander')
  .version(require('../package.json').version)
  .usage('[options] <tests>')
  .option('--headless', 'run local tests headlessly')
  .option('-s, --sauce', 'run Sauce Labs tests')
  .option('-so, --sauce-only', 'only run tests on Sauce Labs')
  .option('-L, --no-local', 'do not run local tests (run headless or sauce instead)')
  .option('-b, --browsers <names>', 'only run tests specified for these browsers')
  .option('-ib', '--ignore-browsers <names>', 'ignore running tests for these browsers')
  .option('-c, --concurrency <n>', 'test concurrency', parseInt)
  .option('-lc, --local-concurrency <n>', 'local test concurrency', parseInt)
  .option('-sc, --sauce-concurrency <n>', 'Sauce Labs test concurrency', parseInt)
  .parse(process.argv)
