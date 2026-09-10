export type ServiceStatus = "ok" | "degraded" | "down" | "unknown";
export interface ServiceCheck { name: string; description: string; url?: string; status: ServiceStatus; latencyMs?: number }
export function aggregateStatus(checks: Pick<ServiceCheck, "status">[]): ServiceStatus {
  if (!checks.length) return "unknown";
  for (const status of ["down", "degraded", "unknown"] as const) if (checks.some(check => check.status === status)) return status;
  return "ok";
}
/** HTTP reachability only. This does not certify application, data or transaction correctness. */
export async function probeService(name: string, description: string, url: string, timeoutMs = 5000, headers?: HeadersInit): Promise<ServiceCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const response = await fetch(url, { headers, signal: controller.signal, cache: "no-store" });
    const latencyMs = Date.now() - start;
    await response.body?.cancel();
    const status = response.status === 401 || response.status === 403 ? "unknown" : !response.ok || latencyMs >= 2000 ? "degraded" : "ok";
    return { name, description, url, status, latencyMs };
  } catch { return { name, description, url, status: "down" }; }
  finally { clearTimeout(timeout); }
}
