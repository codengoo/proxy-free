import type { ProxyRecord } from "../interfaces";

export type ProxyCheckTarget = string | Pick<ProxyRecord, "ip" | "port" | "protocol">;

export function parseProxyTarget(
    target: ProxyCheckTarget,
): { host: string; port: number; protocol: string } | null {
    if (typeof target !== "string") {
        return {
            host: target.ip,
            port: target.port,
            protocol: normalizeProtocol(target.protocol ?? "http"),
        };
    }

    const normalized = target.includes("://") ? target : `http://${target}`;

    try {
        const url = new URL(normalized);
        if (!url.hostname || !url.port) {
            return null;
        }

        return {
            host: url.hostname,
            port: Number(url.port),
            protocol: normalizeProtocol(url.protocol || "http"),
        };
    } catch (error) {
        return null;
    }
}

function normalizeProtocol(protocol: string): string {
    return protocol.replace("://", "").replace(/:$/, "").toLowerCase();
}
