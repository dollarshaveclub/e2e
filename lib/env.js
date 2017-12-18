
exports.headless = !!process.env.E2E_HEADLESS
exports.concurrency = ~~process.env.E2E_CONCURRENCY || 1
exports.localConcurrency = ~~process.env.E2E_LOCAL_CONCURRENCY
exports.sauceConcurrency = ~~process.env.E2E_SAUCE_CONCURRENCY
