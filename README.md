# @dollarshaveclub/e2e

[![CircleCI](https://circleci.com/gh/dollarshaveclub/e2e/tree/master.svg?style=svg&circle-token=3c62580973ef5525cd6a68b7e57bd8d9e603a91e)](https://circleci.com/gh/dollarshaveclub/e2e/tree/master)
[![codecov](https://codecov.io/gh/dollarshaveclub/e2e/branch/master/graph/badge.svg?token=RL1k07t3tS)](https://codecov.io/gh/dollarshaveclub/e2e)
[![Greenkeeper badge](https://badges.greenkeeper.io/dollarshaveclub/e2e.svg?token=53420725e4efa55047668b13f8221d19e6c294e7783481a4300c63fbed4ba71c&ts=1510792360361)](https://greenkeeper.io/)

A end-to-end test runner currently built for:

- Official Selenium Webdriver JS SDK - http://seleniumhq.github.io/selenium/docs/api/javascript/
- Sauce Labs

We built a runner to help mitigate flakiness and maximize test speed:

- Retry support - retry a test as many times as you'd like
- Retry local tests on Sauce Labs - if a local test keeps failing, retry it on Sauce Labs for the logs, video, and screenshots
- Parallelism and concurrency - run local and remote tests with separate, configurable concurrencies
- Per-step timeouts - helps debug your E2E tests when your `await`s hang, which is the correct way to write Selenium tests

We also added features to make writing and running tests easier:

- Automatically setup and destroy your `selenium` driver so you don't have to
- Filter tests by browsers
- Filter tests by local or remote (Sauce Labs) tests
- Unwinding - easily run your tests multiple times with different parameters and clients

See our [example tests](tests/).

## Installation

Install Selenium:

```bash
brew install selenium-server-standalone chromedriver geckodriver
```

Start the Selenium server:

```bash
brew services start selenium-server-standalone
```

Install node@8+:

```bash
nvm install 8
```

## API

### Running Tests

Install this package:

```bash
npm install @dollarshaveclub/e2e
```

Run the executable:

```bash
./node_modules/.bin/dsc-e2e -h
```

### Tests

#### exports.config\<Object\>

Options for running the test.

Options are:

- `driverTimeout='90s'`
- `stepTimeout='30s'`
- `stepSlowThreshold='5s'`
- `retries=1`
- `retryWithSauceLabs=true`
- `clients=[]`
  - `browser='chrome'`

#### exports.parameters<Object|Array>

Various parameters to run your test.
Passed to your `.test` function and is intended to be used within it.
If your parameters is an array, your test will for each object in the array as a parameter.

#### exports.test<Function>({ driver, step, parameters })

Define your actual test in this function.

#### step(name<String>, fn<AsyncFunction>, options<Object>)

Think of this as a `test()` or `it()`.

#### step.skip()

Same as `step()`, but is not actually ran.
