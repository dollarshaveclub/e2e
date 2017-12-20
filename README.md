# @dollarshaveclub/e2e

[![CircleCI](https://circleci.com/gh/dollarshaveclub/e2e/tree/master.svg?style=svg&circle-token=3c62580973ef5525cd6a68b7e57bd8d9e603a91e)](https://circleci.com/gh/dollarshaveclub/e2e/tree/master)
[![codecov](https://codecov.io/gh/dollarshaveclub/e2e/branch/master/graph/badge.svg?token=RL1k07t3tS)](https://codecov.io/gh/dollarshaveclub/e2e)
[![Greenkeeper badge](https://badges.greenkeeper.io/dollarshaveclub/e2e.svg?token=53420725e4efa55047668b13f8221d19e6c294e7783481a4300c63fbed4ba71c&ts=1510792360361)](https://greenkeeper.io/)

A end-to-end test runner currently built for:

- Official Selenium Webdriver JS SDK - http://seleniumhq.github.io/selenium/docs/api/javascript/
- Google Chrome's Puppeteer - https://github.com/GoogleChrome/puppeteer
- Sauce Labs

This test runner mitigates test flakiness and maximizes test speed:

- Retry support - retry a test as many times as you'd like
- Retry local tests on Sauce Labs - if a local Selenium test keeps failing, retry it on Sauce Labs the logs, video, and screenshots
- Parallelism and concurrency - run local and remote tests with separate, configurable concurrencies
- Per-step timeouts - helps debug your E2E tests when your `await`s hang, which is the correct way to write Selenium tests

It also has features to make writing and running tests easier:

- Automatically setup and destroy your `selenium` or `puppeteer` driver so you don't have to
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

You can define multiple `clients` and multiple `parameters` per test.
If you have 5 clients and 5 parameters, your tests will run 5x5 = 25 times.
Keep this in mind as you add `clients` and `parameters`.

#### exports.config\<Object\>

Options for running the test.

Options are:

- `stepTimeout='30s'` - the default timeout for each `step`
- `stepSlowThreshold='5s'` - after this threshold is met for each `step`, the color of the step is `yellow`
- `retries=1` - number of times to retry a test
- `retryWithSauceLabs=true` - whether to retry failing tests on Sauce Labs when ran with Sauce Labs enabled
- `clients=[]` - an array of clients to test with.
  - `browser='chrome'`
  - `width=1280`
  - `height=960`
  - `platform={}` - the platform to run on, specifically on Sauce Labs
      - `width=1280`
      - `height=960`
- `driver='selenium'` - which driver to use.
  - Valid values: `selenium`, `puppeteer`

#### exports.parameters\<Object|Array>

Various parameters to run your test.
Passed to your `.test` function and is intended to be used within it.
If your parameters is an array, your test will run for each value in the array.

#### exports.test\<Function>({ step, parameters, ... })

Define your actual test in this function.

- `step` - define your tests in `step`s
- `parameters` - the parameters defined for your test via `exports.parameters`

##### Selenium Options

- `driver` - the Selenium SDK driver instance

##### Puppeteer Options

- `browser` - Puppeteer browser instance
- `page` - a Puppeteer page instance

#### step(name\<String>, fn\<AsyncFunction>, options\<Object>)

A step in your test. Think of this as a `test()` or `it()` from `mocha` or `jest`.
As this runner is designed for end-to-end tests, calling each code block `step`s
makes more sense than calling it `test()` or `it()`.
Unlike other frameworks, there is no nesting of `step()`s.

For example, if are testing the end-to-end flow of a conversion funnel,
each action a user takes would be a `step`.
Practically, however, you should write each `await` within its own `step`.
The reason is many `await`s wait for a condition to occur, and the only way
to test that it does not occur is to timeout.

Thus, the options for each `step` are:

- `timeout` - the timeout for this step
- `slowThreshold` - when this step is considered slow

#### step.skip()

Same as `step()`, but is not actually ran.

#### exports.description<Function|String>

Description of your test.
