# @dollarshaveclub/e2e

A end-to-end test runner currently built for:

- Official Selenium Webdriver JS SDK - http://seleniumhq.github.io/selenium/docs/api/javascript/
- Sauce Labs

End-to-end tests is inherently flaky, so we built a runner to help mitigate the flakiness:

- Automatically setup and destroy your `selenium` driver so you don't have to
- Retry support - retry a test as many times as you'd like
- Retry local tests on Sauce Labs - if a local test keeps failing, retry it on Sauce Labs for the logs, video, and screenshots
- Filter tests by browsers
- Filter tests by local or remote (Sauce Labs) tests
- Parallelism and concurrency - run local and remote tests with separate, configurable concurrencies
- Per-step timeouts - helps debug your E2E tests when your `await`s hang
- Unwinding - easily run your tests multiple times with different parameters and clients

See our [example tests](tests/).

## API

### Running Tests

### Tests

#### exports.config\<Object\>

Options for running the test.

#### exports.parameters<Object|Array>

Various parameters to run your test.
Passed to your `.test` function and is intended to be used within it.

#### exports.test<Function>({ driver, step }, { parameters })

#### step(name<String>, fn<AsyncFunction>, options<Object>)

#### step.skip()

Same as `step()`, but is not actually ran.
