import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { beforeEach, expect, it, vi } from "vitest";
const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
const origin = "https://tevaxia.lu";
let handlers: Record<string, (event: Record<string, unknown>) => void>;
let storage: ReturnType<typeof setup>;
function setup() {
  const cache = { add: vi.fn().mockResolvedValue(undefined), match: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined) };
  const caches = { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(true) };
  const fetch = vi.fn().mockImplementation(async () => new Response("network"));
  const self = { location: { origin }, addEventListener: (name: string, handler: (event: Record<string, unknown>) => void) => { handlers[name] = handler; }, skipWaiting: vi.fn().mockResolvedValue(undefined), clients: { claim: vi.fn().mockResolvedValue(undefined) } };
  runInNewContext(source, { self, caches, fetch, URL, Request, Response });
  return { cache, caches, fetch, self };
}
beforeEach(() => { handlers = {}; storage = setup(); });
async function lifecycle(name: string) { let work: Promise<unknown> | undefined; handlers[name]({ waitUntil: (promise: Promise<unknown>) => { work = promise; } }); await work; }
function request(path: string, extras: Record<string, unknown> = {}) {
  let response: Promise<Response> | undefined;
  const input = { url: new URL(path, origin).href, method: "GET", mode: "navigate", headers: new Headers(), ...extras };
  handlers.fetch({ request: input, respondWith: (promise: Promise<Response>) => { response = promise; } });
  return response;
}
it("precaches only public offline screens and fixed assets without credentials", async () => {
  await lifecycle("install");
  expect(storage.cache.add).toHaveBeenCalledTimes(7);
  const requests = storage.cache.add.mock.calls.map(([r]) => r as Request);
  expect(requests.map(r => new URL(r.url).pathname)).toEqual(["/offline", "/en/offline", "/de/offline", "/pt/offline", "/lb/offline", "/manifest.json", "/logo-tevaxia-512.svg"]);
  expect(requests.every(r => r.credentials === "omit" && r.cache === "reload")).toBe(true);
});
it("removes old Tevaxia navigation caches without clearing unrelated caches", async () => {
  storage.caches.keys.mockResolvedValue(["tevaxia-v2", "tevaxia-v3", "tevaxia-v4", "another-app", "tevaxia-user-files"]);
  await lifecycle("activate");
  expect(storage.caches.delete.mock.calls.map(([key]) => key)).toEqual(["tevaxia-v2", "tevaxia-v3"]);
  expect(storage.self.clients.claim).toHaveBeenCalledOnce();
});
it("never stores online navigations, including private pages and token URLs", async () => {
  for (const path of ["/", "/en/pms/property/factures", "/copropriete/private-token?tab=account"]) {
    expect(await (await request(path))!.text()).toBe("network");
  }
  expect(storage.cache.put).not.toHaveBeenCalled(); expect(storage.cache.match).not.toHaveBeenCalled();
});
it("falls back by language without consulting the previously visited private page", async () => {
  storage.fetch.mockRejectedValue(new Error("offline"));
  for (const prefix of ["", "/en", "/de", "/pt", "/lb"]) {
    storage.cache.match.mockImplementation(async (key: string) => key === prefix + "/offline" ? new Response(prefix || "fr") : undefined);
    expect(await (await request(prefix + "/pms/private/factures"))!.text()).toBe(prefix || "fr");
  }
  expect(storage.cache.match.mock.calls.every(([key]) => typeof key === "string" && key.endsWith("/offline"))).toBe(true);
});
it("does not intercept API, RSC, authenticated, non-GET or lookalike-origin requests", () => {
  for (const [path, extras] of [
    ["/api/private", {}], ["/page?_rsc=123", {}], ["/_next/data/build/data.json", {}],
    ["/page", { headers: new Headers({ RSC: "1" }) }], ["/_next/static/chunk.js", { headers: new Headers({ Authorization: "Bearer fixture" }) }],
    ["/page", { method: "POST" }], ["https://tevaxia.lu.other.example/_next/static/a.js", {}],
  ] as [string, Record<string, unknown>][]) expect(request(path, extras)).toBeUndefined();
  expect(storage.fetch).not.toHaveBeenCalled();
});
it("caches immutable build assets and serves them from the current cache", async () => {
  expect(await (await request("/_next/static/chunk.js", { mode: "cors" }))!.text()).toBe("network");
  expect(storage.cache.put).toHaveBeenCalledOnce();
  storage.cache.match.mockResolvedValue(new Response("cached build"));
  expect(await (await request("/_next/static/chunk.js", { mode: "cors" }))!.text()).toBe("cached build");
  expect(storage.fetch).toHaveBeenCalledOnce();
  expect(request("/private/export.js", { mode: "cors" })).toBeUndefined();
});
it("does not cache responses explicitly marked private or no-store", async () => {
  for (const directive of ["private, max-age=0", "no-store"]) {
    storage.fetch.mockResolvedValueOnce(new Response("network", { headers: { "Cache-Control": directive } }));
    await request("/_next/static/chunk.js", { mode: "cors" });
  }
  expect(storage.cache.put).not.toHaveBeenCalled();
});
it("returns a plain offline response when no offline screen or cache is available", async () => {
  storage.fetch.mockRejectedValue(new Error("offline"));
  expect((await request("/lb/private"))!.status).toBe(503);
  storage.caches.open.mockRejectedValue(new Error("storage unavailable"));
  expect((await request("/en/private"))!.status).toBe(503);
});

it("activates the safe worker even when cache cleanup is unavailable", async () => {
  storage.caches.keys.mockRejectedValue(new Error("storage unavailable"));
  await lifecycle("activate");
  expect(storage.self.clients.claim).toHaveBeenCalledOnce();
});
