// https://docs.travis-ci.com/user/environment-variables/#Convenience-Variables

exports.concurrency = ~~process.env.E2E_CONCURRENCY || 1
exports.localConcurrency = ~~process.env.E2E_LOCAL_CONCURRENCY
exports.sauceConcurrency = ~~process.env.E2E_SAUCE_CONCURRENCY

exports.CIRCLECI = !!process.env.CIRCLECI
exports.TRAVIS = !!process.env.TRAVIS
exports.CI = !!process.env.CI || exports.CIRCLECI || exports.TRAVIS
exports.USER = process.env.USER

exports.repository = (() => {
  if (exports.CIRCLECI) return process.env.CIRCLE_REPOSITORY_URL.split('/').pop().replace('.git', '')
  if (exports.TRAVIS) return process.env.TRAVIS_REPO_SLUG.split('/').pop().replace('.git', '')
  return null
})()

exports.commit = (() => {
  if (exports.CIRCLECI) return process.env.CIRCLE_SHA1
  if (exports.TRAVIS) return process.env.TRAVIS_PULL_REQUEST_SHA || process.env.TRAVIS_COMMIT
  return null
})()

// set this if saucelabs is down
exports.DISABLE_SAUCELABS = !!process.env.DISABLE_SAUCELABS

// specifically for saucelabs names
if (exports.CIRCLECI) {
  exports.gitBranch = process.env.CIRCLE_BRANCH
  exports.ciBuild = process.env.CIRCLE_BUILD_NUM
  // only show the PR #s
  exports.pullRequests = (process.env.CI_PULL_REQUESTS || process.env.CI_PULL_REQUEST || '')
    .split(',')
    .map(x => x.split('/').pop())
    .join(',')
}
