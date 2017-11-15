
const debug = require('debug')('dsc-e2e:lib:find-tests')
const globby = require('globby')
const path = require('path')

module.exports = (args) => {
  debug('args: %o', args)
  const filenames = globby.sync(args)
  debug('filenames: %o', filenames)
  return filenames.map((filename) => {
    const config = require(path.resolve(filename))
    config.filename = filename
    config.id = config.id || filename
    return config
  })
}
