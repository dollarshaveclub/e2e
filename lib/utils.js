
const ms = require('ms')

const hrtimeToMS = (diff) => diff[0] * 1e3 + diff[1] * 1e-6

const getElapsedTime = (start) => Math.round(hrtimeToMS(process.hrtime(start)))

const logElapsedTime = (ms) => ms > 1000 ? `${ms / 1000}s` : `${ms}ms`

const toMS = (x, defaultMS) => {
  if (typeof x === 'string') return ms(x)
  if (typeof x === 'number') return x
  return ms(defaultMS)
}

const sleep = interval => new Promise(resolve => setTimeout(resolve, toMS(interval || 100)).unref())

const createTimeoutError = (message) => {
  const err = new Error(message)
  err.code = 'ETIMEDOUT'
  return err
}

const getDuplicates = (array) => {
  const out = []
  array.forEach((x, i) => {
    if (out.includes(x)) return
    if (!array.slice(i + 1).includes(x)) return
    out.push(x)
  })
  return out
}

const concat = (a, b) => a.concat(b)

const unwind = (value, map) => {
  assert.equal(typeof value, 'object', 'You can only unwind objects: ' + JSON.stringify(value))
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

Object.assign(exports, {
  hrtimeToMS,
  getElapsedTime,
  logElapsedTime,
  toMS,
  createTimeoutError,
  sleep,
  getDuplicates,
  concat,
  unwind,
})
