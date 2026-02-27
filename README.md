# proxy-free

TypeScript client for the ProxyScrape free proxy list API. It wraps the documented JSON endpoint, fetches data with `axios`, and gives you typed access to the proxy metadata returned by the service.

## Installation

```bash
npm install proxy-free
```

## Quick start

```ts
import { fetchProxyList } from 'proxy-free'

const { proxies } = await fetchProxyList({
  query: {
    protocol: ['http', 'https'],
    country: ['US', 'DE'],
    anonymity: 'elite',
    limit: 50,
  },
})

console.log(`Received ${proxies.length} proxies`)
console.log(`First proxy endpoint: ${proxies[0]?.proxy}`)
```

## Advanced usage

Create a reusable client if you need to tweak timeouts, base URLs, or other Axios options:

```ts
import { ProxyScrapeClient } from 'proxy-free'

const client = new ProxyScrapeClient({
  timeoutMs: 5_000,
})

const data = await client.fetchProxyList({
  params: {
    // You can add vendor-specific parameters not covered by the helper type
    user_identifier: 'demo-app',
  },
  query: {
    ssl: true,
    limit: 100,
  },
})
```

### Query helpers

`ProxyScrapeQuery` lets you set the most common filters supported by the endpoint:

- `protocol`: one or more of `http`, `https`, `socks4`, `socks5`
- `country`: ISO country codes (single string or array)
- `anonymity`: `transparent`, `anonymous`, or `elite`
- `limit` / `skip`: pagination helpers mirroring the API response fields
- `ssl`: boolean flag to only return SSL-capable proxies
- `timeout`: pass-through numeric value accepted by ProxyScrape

Anything else can be appended through the `params` option or by providing your own Axios instance.

## Type definitions

The library exports strong types for the entire JSON payload, so you can rely on autocomplete when inspecting proxy metadata:

```ts
import type { ProxyRecord } from 'proxy-free'

function formatProxy(proxy: ProxyRecord) {
  return `${proxy.protocol}://${proxy.ip}:${proxy.port} - ${proxy.ip_data.country}`
}
```

## Building

```bash
npm run build
```

This runs `tsdown`, producing dual ESM/CJS bundles and `.d.mts/.d.cts` declaration files under `dist/`.

## Testing

```bash
npm run test
```

Vitest runs completely offline thanks to the mocked Axios layer inside the test suite, so CI does not depend on the live ProxyScrape service.
