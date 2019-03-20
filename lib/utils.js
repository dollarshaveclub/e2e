
const assert = require('assert')
const ms = require('ms')

const hrtimeToMS = (diff) => diff[0] * 1e3 + diff[1] * 1e-6

const getElapsedTime = (start) => Math.round(hrtimeToMS(process.hrtime(start)))

const logElapsedTime = (ms) => ms > 1000 ? `${ms / 1000}s` : `${ms}ms`

const toMS = (x, defaultMS) => {
  if (typeof x === 'string') return ms(x)
  if (typeof x === 'number') return x
  return ms(defaultMS)
}

// NOTE: only for timeouts
const sleep = interval => new Promise(resolve => setTimeout(resolve, toMS(interval || 100)).unref())

const createTimeoutError = (message) => {
  const err = new Error(message)
  err.code = 'ETIMEDOUT'
  return err
}

const concat = (a, b) => a.concat(b)

const unwind = (value, map) => {
  assert.strictEqual(typeof value, 'object', 'You can only unwind objects: ' + JSON.stringify(value))
  assert(!Array.isArray(value), 'You cannot unwind arrays: ' + JSON.stringify(value))

  let out = [value]
  Object.keys(map).forEach((key) => {
    out = out.map((obj) => {
      if (!obj[key]) return [obj]
      if (!Array.isArray(obj[key])) return [obj]
      return obj[key].map((value) => {
        const copy = Object.assign({}, obj)
        delete copy[key]
        copy[map[key]] = value
        return copy
      })
    }).reduce(concat, [])
  })
  return out
}

const isPromise = (x) => x && typeof x.then === 'function'

const parseErrorEmitEvent = (result, ctx, emitter) => {
  const err = result.error
  const stepName = result.name

  if (!ctx || !emitter) return
  const testId = ctx.test.id

  if (err.code === 'ERR_ASSERTION') {
    emitter.emit('run-step.assertion-failure', { testId, stepName })
  } else if (err.code === 'ETIMEDOUT') {
    emitter.emit('run-step.timeout', { testId, stepName })
  } else if (!err.code) {
    const errString = err.toString().toLowerCase()
    // Some timeouts aren't thrown with a code (as above) so this is a catch-all
    if (errString.includes('timeout') || errString.includes('timed out')) {
      emitter.emit('run-step.timeout', { testId, stepName })
    } else {
      emitter.emit('run-step.unspecified-failure', { testId, stepName })
    }
  }
  emitter.emit('run-step.failure', { testId, stepName })
}

Object.assign(exports, {
  hrtimeToMS,
  getElapsedTime,
  logElapsedTime,
  toMS,
  createTimeoutError,
  sleep,
  concat,
  unwind,
  isPromise,
  parseErrorEmitEvent,
})
