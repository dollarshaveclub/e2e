
const SauceLabs = require('saucelabs')

exports.SAUCE_USERNAME = process.env.SAUCE_USERNAME || process.env.SAUCE_USER || 'dollarshaveclub'
exports.SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_KEY

const saucelabs = new SauceLabs({
  username: exports.SAUCE_USERNAME,
  password: exports.SAUCE_ACCESS_KEY,
})

// example: https://github.com/ndmanvar/JS-Mocha-WebdriverJS/blob/master/tests/sample-spec.js#L47-L50
exports.updateSauceJob = (sessionId, data) => new Promise((resolve, reject) => {
  saucelabs.updateJob(sessionId, data, (err) => {
    if (err) reject(err)
    resolve()
  })
})

exports.createSauceLabName = function createSauceLabName (env) {
  const params = []

  if (env.CIRCLECI) {
    params.push('circleci')
  } else if (env.TRAVIS) {
    params.push('travis')
  } else if (env.CI) {
    params.push('ci')
  } else {
    params.push(env.USER)
  }

  if (env.ciBuild) {
    params.push(`CI#:${env.ciBuild}`)
  }

  if (env.repository) {
    params.push(env.repository)
    if (env.pullRequests) {
      params.push(`PR#:${env.pullRequests}`)
    }
    if (env.gitBranch) {
      params.push(`branch:${env.gitBranch}`)
    }
    if (env.commit) {
      params.push(`commit:${env.commit}`)
    }
  }

  params.push(testConfig.name)

  return params.join(' ')
}
