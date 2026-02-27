import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import {
  fetchProxyList,
  ProxyScrapeClient,
  ProxyScrapeError,
  type ProxyRecord,
  type ProxyScrapeResponse,
} from '../src/index'

const axiosGetMock = vi.hoisted(() => vi.fn())

vi.mock('axios', () => {
  const create = vi.fn(() => ({ get: axiosGetMock }))
  return {
    default: { create },
    create,
  }
})

const sampleProxy: ProxyRecord = {
  alive: true,
  alive_since: 1,
  anonymity: 'elite',
  average_timeout: 150,
  first_seen: 1,
  ip_data: {
    as: 'AS0000 MockNet',
    asname: 'MockNet',
    city: 'Mock City',
    continent: 'North America',
    continentCode: 'NA',
    country: 'Neverland',
    countryCode: 'NV',
    district: 'Central',
    hosting: false,
    isp: 'Mock ISP',
    lat: 0,
    lon: 0,
    mobile: false,
    org: 'Mock Org',
    proxy: true,
    regionName: 'Mock Region',
    status: 'success',
    timezone: 'Etc/UTC',
    zip: '00000',
  },
  ip_data_last_update: 2,
  last_seen: 3,
  port: 3128,
  protocol: 'http',
  proxy: 'http://127.0.0.1:3128',
  ssl: false,
  timeout: 250,
  times_alive: 10,
  times_dead: 1,
  uptime: 99.1,
  ip: '127.0.0.1',
}

const sampleResponse: ProxyScrapeResponse = {
  shown_records: 1,
  total_records: 1,
  limit: 2000,
  skip: 0,
  nextpage: false,
  proxies: [sampleProxy],
}

describe('proxy client', () => {
  beforeEach(() => {
    axiosGetMock.mockReset()
  })

  it('fetches data via mocked axios client with normalized params', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: sampleResponse })

    const result = await fetchProxyList({
      query: {
        protocol: ['http', 'https'],
        country: ['US', 'DE'],
        ssl: true,
        anonymity: 'elite',
        limit: 25,
        skip: 10,
      },
      params: {
        custom_filter: 'latency<200',
      },
    })

    expect(result).toEqual(sampleResponse)
    expect(axiosGetMock).toHaveBeenCalledTimes(1)

    const [, config] = axiosGetMock.mock.calls[0]
    const params = config.params as URLSearchParams

    expect(params.get('request')).toBe('display_proxies')
    expect(params.get('format')).toBe('json')
    expect(params.get('protocol')).toBe('http,https')
    expect(params.get('country')).toBe('US,DE')
    expect(params.get('ssl')).toBe('true')
    expect(params.get('anonymity')).toBe('elite')
    expect(params.get('limit')).toBe('25')
    expect(params.get('skip')).toBe('10')
    expect(params.get('custom_filter')).toBe('latency<200')
  })

  it('throws ProxyScrapeError when the API payload is malformed', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: { unexpected: true } }),
    } as unknown as AxiosInstance

    const client = new ProxyScrapeClient({ httpClient })

    await expect(client.fetchProxyList()).rejects.toBeInstanceOf(ProxyScrapeError)
  })
})
