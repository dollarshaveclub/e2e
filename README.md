# @dollarshaveclub/e2e-runner

A end-to-end test runner currently built for:

- Official Selenium Webdriver JS SDK - http://seleniumhq.github.io/selenium/docs/api/javascript/
- Sauce Labs

We decided to build our own runner because traditional test frameworks do not easily give us the tools we need.
Features:

- Retry support - these tests tend to be flaky
- Retry local tests on Sauce Labs - so you can have a video of your failing test
- Filter by browsers
- Filter by local or remote (Sauce Labs) tests
- Concurrency - run local and remote tests with separate, configurable concurrency
- Per-step timeouts - helps debug your E2E tests when your `await`s hang
- Unwinding - easily run your tests multiple times with different parameters and clients

## API

### Running Tests

### Tests

#### exports.config<Object>

Options for running the test.

#### exports.parameters<Object|Array>

Various parameters to run your test.
Passed to your `.test` function and is intended to be used within it.

#### exports.test<Function>

#### step(name<String>, fn<AsyncFunction>, options<Object>)

#### step.skip()

Same as `step()`, but is not actually ran.
