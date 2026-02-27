
export enum ProxyProtocol {
    HTTP = 'http',
    HTTPS = 'https',
    SOCKS4 = 'socks4',
    SOCKS5 = 'socks5',
}

export enum ProxyAnonymity {
    TRANSPARENT = 'Transparent',
    ANONYMOUS = 'Anonymous',
    ELITE = 'Elite',
}

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
    anonymity?: ProxyAnonymity | ProxyAnonymity[]
    country?: string | string[]
    ssl?: boolean
    limit?: number
    skip?: number
    timeout?: number
}