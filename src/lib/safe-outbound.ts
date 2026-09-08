import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request } from "node:https";

const blocked = new BlockList();
for (const [ip, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",3]] as const) blocked.addSubnet(ip, prefix);
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  return family === 4 ? !blocked.check(ip, "ipv4")
    : family === 6 && globalV6.check(ip, "ipv6") && !blocked.check(ip, "ipv6");
}

/** DNS resolution is pinned to the socket; redirects are deliberately rejected. */
export async function safeOutbound(urlString: string, options: {
  method?: string; headers?: Record<string, string>; body?: string; maxBytes?: number;
} = {}): Promise<{ status: number; text: string }> {
  const url = new URL(urlString);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) throw new Error("Only public HTTPS destinations on port 443 are allowed");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error("Non-public destination rejected");
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const req = request(url, {
      method: options.method ?? "GET", headers: options.headers, agent: false, family: pinned.family,
      lookup: (_host, _opts, callback) => callback(null, pinned.address, pinned.family),
    }, res => {
      const status = res.statusCode ?? 502;
      if (status >= 300 && status < 400) { res.destroy(); reject(new Error("Redirect rejected")); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > (options.maxBytes ?? 2_000_000)) { req.destroy(new Error("Response too large")); return; }
        chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve({ status, text: Buffer.concat(chunks).toString("utf8") }));
    });
    const timer = setTimeout(() => req.destroy(new Error("Request timeout")), 15_000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end(options.body);
  });
}
