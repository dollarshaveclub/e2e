const dogapi = require('dogapi')

class DataDog {
  constructor (dogapiInstance, namespace) {
    this._dogApi = dogapiInstance
    this._namespace = namespace

    dogapiInstance.initialize({
      api_key: process.env.DATADOG_API_KEY,
      app_key: process.env.DATADOG_APP_KEY,
    })
  }

  /**
   * Increments the namespaced metric by the specified quantity.
   * @param {string} metricName
   * @param {number | Array.<number>} quantity
   */
  sendMetric (metricName, quantity) {
    return new Promise((resolve, reject) => {
      this._dogApi.metric.send(`${this._namespace}.${metricName}`, quantity, (err, results) => {
        if (err) return reject(err)
        return resolve(results)
      })
    })
  }
}

// The singleton instance to use for all DataDog tracking:
exports.datadog = new DataDog(dogapi, 'e2e')

exports.DataDog = DataDog
