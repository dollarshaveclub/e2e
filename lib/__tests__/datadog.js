const { DataDog } = require('../datadog')

const datadogApiKey = process.env.DATADOG_API_KEY = '123'
const datadogAppKey = process.env.DATADOG_APP_KEY = '456'
const namespace = 'e2e-tests'
const initializeMock = jest.fn()
const sendMock = jest.fn()

const dogapiMock = {
  initialize: initializeMock,
  metric: {
    send: sendMock,
  },
}

describe('DataDog', () => {
  describe('When the instance is constructed', () => {
    it('initializes the underlying dogapi', () => {
      const datadog = new DataDog(dogapiMock, namespace)
      expect(datadog).toBeInstanceOf(DataDog)
      expect(initializeMock).toHaveBeenCalledWith({
        api_key: datadogApiKey,
        app_key: datadogAppKey,
      })
      initializeMock.mockClear()
    })
  })

  describe('sendMetric', () => {
    describe('on success', () => {
      it('uses underlying dogapi to send the metric', async done => {
        const sendMockResponse = { status: 'ok' }
        sendMock.mockImplementation((metricName, quantity, callback) => callback(null, sendMockResponse))
        const datadog = new DataDog(dogapiMock, namespace)
        const metricName = 'some.test-failure'
        const metricQuantity = 17
        const response = await datadog.sendMetric(metricName, metricQuantity)
        expect(response).toBe(sendMockResponse)
        expect(sendMock).toHaveBeenCalledWith(`${namespace}.${metricName}`, metricQuantity, expect.any(Function))
        sendMock.mockClear()
        done()
      })
    })

    describe('on failure', () => {
      it('throws an error', async done => {
        expect.assertions(1)
        const errorMessage = 'Oops, your pants fell down.'
        sendMock.mockImplementation((metricName, quantity, callback) => callback(new Error(errorMessage), null))
        const datadog = new DataDog(dogapiMock, namespace)
        try {
          await datadog.sendMetric('another.test-failure', 35)
          // We shouldn’t ever get here because we expect it to throw:
          expect(true).toBe(false)
        } catch (err) {
          expect(err.message).toBe(errorMessage)
        }
        sendMock.mockClear()
        done()
      })
    })
  })
})
