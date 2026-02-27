import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const DEFAULT_ENDPOINT = 'https://api.proxyscrape.com/v4/free-proxy-list/get'
const BASE_QUERY = {
  request: 'display_proxies',
  proxy_format: 'protocolipport',
  format: 'json',
} as const

const DEFAULT_TIMEOUT_MS = 10_000

type QueryPrimitive = string | number | boolean

type QueryRecord = Record<string, QueryPrimitive | QueryPrimitive[] | undefined>

export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5'

export type ProxyAnonymity = 'transparent' | 'anonymous' | 'elite'

export interface ProxyIpData {
  as: string
  asname: string
  city: string
  continent: string
  continentCode: string
  country: string
  countryCode: string
  district: string
  hosting: boolean
  isp: string
  lat: number
  lon: number
  mobile: boolean
  org: string
  proxy: boolean
  regionName: string
  status: string
  timezone: string
  zip: string
}

export interface ProxyRecord {
  alive: boolean
  alive_since: number
  anonymity: ProxyAnonymity
  average_timeout: number
  first_seen: number
  ip_data: ProxyIpData
  ip_data_last_update: number
  last_seen: number
  port: number
  protocol: ProxyProtocol
  proxy: string
  ssl: boolean
  timeout: number
  times_alive: number
  times_dead: number
  uptime: number
  ip: string
}

export interface ProxyScrapeResponse {
  shown_records: number
  total_records: number
  limit: number
  skip: number
  nextpage: boolean | number | string | null
  proxies: ProxyRecord[]
}

export interface ProxyScrapeQuery {
  protocol?: ProxyProtocol | ProxyProtocol[]
  country?: string | string[]
  ssl?: boolean
  anonymity?: ProxyAnonymity | ProxyAnonymity[]
  limit?: number
  skip?: number
  timeout?: number
}

export interface ProxyScrapeClientOptions {
  baseUrl?: string
  timeoutMs?: number
  httpClient?: AxiosInstance
  requestConfig?: AxiosRequestConfig
}

export interface FetchProxyListOptions {
  query?: ProxyScrapeQuery
  params?: QueryRecord
  signal?: AbortSignal
  timeoutMs?: number
  requestConfig?: AxiosRequestConfig
}

export class ProxyScrapeError extends Error {
  constructor(message: string, public readonly payload?: unknown) {
    super(message)
    this.name = 'ProxyScrapeError'
  }
}

export class ProxyScrapeClient {
  private readonly client: AxiosInstance
  private readonly baseUrl: string
  private readonly baseRequestConfig: AxiosRequestConfig

  constructor(options?: ProxyScrapeClientOptions) {
    this.client = options?.httpClient ?? axios.create()
    this.baseUrl = options?.baseUrl ?? DEFAULT_ENDPOINT
    this.baseRequestConfig = {
      timeout: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      ...options?.requestConfig,
    }
  }

  async fetchProxyList(options?: FetchProxyListOptions): Promise<ProxyScrapeResponse> {
    const params = buildParams(options?.query, options?.params)
    const response = await this.client.get<ProxyScrapeResponse>(this.baseUrl, {
      ...this.baseRequestConfig,
      ...options?.requestConfig,
      timeout: options?.timeoutMs
        ?? options?.requestConfig?.timeout
        ?? this.baseRequestConfig.timeout
        ?? DEFAULT_TIMEOUT_MS,
      params,
      signal: options?.signal,
    })

    const data = response.data
    if (!data || !Array.isArray(data.proxies)) {
      throw new ProxyScrapeError('Unexpected response payload', data)
    }

    return data
  }
}

const defaultClient = new ProxyScrapeClient()

export const fetchProxyList = (
  options?: FetchProxyListOptions,
): Promise<ProxyScrapeResponse> => defaultClient.fetchProxyList(options)

function buildParams(query?: ProxyScrapeQuery, extra?: QueryRecord) {
  const params = new URLSearchParams()
  Object.entries(BASE_QUERY).forEach(([key, value]) => params.set(key, value))
  appendRecord(params, normalizeQuery(query))
  appendRecord(params, extra)
  return params
}

function normalizeQuery(query?: ProxyScrapeQuery): QueryRecord | undefined {
  if (!query) return undefined
  return {
    protocol: query.protocol,
    country: query.country,
    ssl: query.ssl,
    anonymity: query.anonymity,
    limit: query.limit,
    skip: query.skip,
    timeout: query.timeout,
  }
}

function appendRecord(params: URLSearchParams, record?: QueryRecord) {
  if (!record) return
  Object.entries(record).forEach(([key, value]) => {
    appendParam(params, key, value)
  })
}

function appendParam(params: URLSearchParams, key: string, value?: QueryPrimitive | QueryPrimitive[]) {
  if (value === undefined) return
  if (Array.isArray(value)) {
    if (!value.length) return
    params.set(key, value.map(formatPrimitive).join(','))
    return
  }

  params.set(key, formatPrimitive(value))
}

function formatPrimitive(value: QueryPrimitive) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}
