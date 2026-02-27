import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    ProxyAnonymity,
    ProxyProtocol,
    ProxyScrapeClient,
    ProxyScrapeError,
    type ProxyRecord,
    type ProxyScrapeResponse,
} from '../src'

const axiosInstanceGetMock = vi.hoisted(() => vi.fn())
const axiosDirectGetMock = vi.hoisted(() => vi.fn())

vi.mock('axios', () => {
    const create = vi.fn(() => ({ get: axiosInstanceGetMock }))
    return {
        default: { create, get: axiosDirectGetMock },
        create,
        get: axiosDirectGetMock,
    }
})

const sampleProxy: ProxyRecord = {
    alive: true,
    alive_since: 1,
    anonymity: ProxyAnonymity.ELITE,
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
    protocol: ProxyProtocol.HTTP,
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

describe('ProxyScrapeClient', () => {
    let client: ProxyScrapeClient

    beforeEach(() => {
        axiosInstanceGetMock.mockReset()
        axiosDirectGetMock.mockReset()
        client = new ProxyScrapeClient()
    })

    it('fetches data via mocked axios client with normalized params', async () => {
        axiosInstanceGetMock.mockResolvedValueOnce({ data: sampleResponse })

        const result = await client.getProxyList({
            protocol: [ProxyProtocol.HTTP, ProxyProtocol.HTTPS],
            country: ['US', 'DE'],
            ssl: true,
            anonymity: ProxyAnonymity.ELITE,
            limit: 25,
            skip: 10,
        })

        expect(result).toEqual(sampleResponse)
        expect(axiosInstanceGetMock).toHaveBeenCalledTimes(1)

        const [, config] = axiosInstanceGetMock.mock.calls[0]
        const params = config.params as Record<string, string>

        expect(params.request).toBe('display_proxies')
        expect(params.format).toBe('json')
        expect(params.protocol).toBe('http,https')
        expect(params.country).toBe('US,DE')
        expect(params.ssl).toBe('true')
        expect(params.anonymity).toBe(ProxyAnonymity.ELITE)
        expect(params.limit).toBe('25')
        expect(params.skip).toBe('10')
    })

    it('throws ProxyScrapeError when the API payload is malformed', async () => {
        axiosInstanceGetMock.mockResolvedValueOnce({ data: { unexpected: true } })

        await expect(client.getProxyList()).rejects.toBeInstanceOf(ProxyScrapeError)
    })

    it('returns a deterministic proxy within the top 10 when using getBestRandom', async () => {
        const proxies = Array.from({ length: 12 }, (_, index) => ({
            ...sampleProxy,
            ip: `10.0.0.${index + 1}`,
            proxy: `http://10.0.0.${index + 1}:${3000 + index}`,
            port: 3000 + index,
            uptime: 50 + index,
            average_timeout: 200 - index,
            alive: index % 6 !== 0,
        }))

        axiosInstanceGetMock.mockResolvedValueOnce({
            data: {
                ...sampleResponse,
                proxies,
            },
        })

        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.35)

        const selected = await client.getBestRandom()
        randomSpy.mockRestore()

        expect(selected?.ip).toBe('10.0.0.9')
    })

    it('checkProxy validates the upstream IP via api.ipify.org', async () => {
        axiosDirectGetMock.mockResolvedValueOnce({ data: { ip: sampleProxy.ip } })

        const result = await ProxyScrapeClient.checkProxy(sampleProxy)

        expect(result).toBe(true)

        const [, config] = axiosDirectGetMock.mock.calls[0]
        expect(config?.proxy).toMatchObject({
            host: sampleProxy.ip,
            port: sampleProxy.port,
            protocol: sampleProxy.protocol,
        })

        axiosDirectGetMock.mockResolvedValueOnce({ data: { ip: '203.0.113.1' } })
        const mismatch = await ProxyScrapeClient.checkProxy(sampleProxy)
        expect(mismatch).toBe(false)
    })

    it('checkProxy returns false when parsing fails or the request errors', async () => {
        expect(await ProxyScrapeClient.checkProxy('invalid-proxy')).toBe(false)

        axiosDirectGetMock.mockRejectedValueOnce(new Error('network'))
        expect(await ProxyScrapeClient.checkProxy(sampleProxy)).toBe(false)
    })
})
