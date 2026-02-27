import type { AxiosInstance } from "axios";
import axios from "axios";
import type {
    ProxyRecord,
    ProxyScrapeQuery,
    ProxyScrapeResponse,
} from "../interfaces";
import { buildParams, parseProxyTarget, type ProxyCheckTarget } from "../utils";

const DEFAULT_ENDPOINT = "https://api.proxyscrape.com/v4";
const BASE_QUERY = {
    request: "display_proxies",
    proxy_format: "protocolipport",
    format: "json",
};

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_BEST_RESULTS = 10;
const IPIFY_ENDPOINT = "https://api.ipify.org";
const CHECK_PROXY_TIMEOUT_MS = 7_000;

export class ProxyScrapeError extends Error {
    constructor(
        message: string,
        public readonly payload?: unknown,
    ) {
        super(message);
        this.name = "ProxyScrapeError";
    }
}

export class ProxyScrapeClient {
    private readonly client: AxiosInstance;

    constructor(client?: AxiosInstance) {
        this.client =
            client ??
            axios.create({
                baseURL: DEFAULT_ENDPOINT,
                timeout: DEFAULT_TIMEOUT_MS,
            });
    }

    async getProxyList(
        params: ProxyScrapeQuery = {},
    ): Promise<ProxyScrapeResponse> {
        const response = await this.client.get<ProxyScrapeResponse>(
            "/free-proxy-list/get",
            {
                params: buildParams({
                    ...BASE_QUERY,
                    ...params,
                }),
            },
        );

        const data = response.data;
        if (!data || !Array.isArray(data.proxies)) {
            throw new ProxyScrapeError("Unexpected response payload", data);
        }

        return data;
    }

    async getBestRandom(
        params: ProxyScrapeQuery = {},
        count: number = MAX_BEST_RESULTS,
    ): Promise<ProxyRecord[]> {
        const { proxies } = await this.getProxyList(params);
        const ranked = proxies
            .filter((proxy) => proxy.alive)
            .sort(compareProxies)
            .slice(0, count);

        if (!ranked.length) return [];

        return ranked;
    }

    static async checkProxy(target: ProxyCheckTarget): Promise<boolean> {
        const proxy = parseProxyTarget(target);
        if (!proxy) return false;

        try {
            const { data: detectedIp } = await axios.get<{ ip?: string } | string>(
                IPIFY_ENDPOINT,
                {
                    timeout: CHECK_PROXY_TIMEOUT_MS,
                    proxy: {
                        host: proxy.host,
                        port: proxy.port,
                        protocol: proxy.protocol,
                    },
                },
            );

            console.log(detectedIp);
            return detectedIp === proxy.host;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

function compareProxies(a: ProxyRecord, b: ProxyRecord): number {
    if (b.uptime !== a.uptime) {
        return b.uptime - a.uptime;
    }

    if (a.average_timeout !== b.average_timeout) {
        return a.average_timeout - b.average_timeout;
    }

    return a.timeout - b.timeout;
}
