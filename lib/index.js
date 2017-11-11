
const RunTests = require('./run-tests')

module.exports = async (tests, options) => new RunTests(tests, options).exec()
