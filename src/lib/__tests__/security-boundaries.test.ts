import { describe, expect, it } from "vitest";
import { isPublicAddress, safeOutbound } from "../safe-outbound";
import { validateICal } from "../pms/ical-parser";
import { GET } from "@/app/api/psd2/debug/route";

describe("security boundaries", () => {
  it("never returns banking material, even when configured", async () => {
    process.env.ENABLE_BANKING_APP_ID = "test";
    process.env.ENABLE_BANKING_PRIVATE_KEY = "private-test";
    const res = await GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
  it("blocks private, metadata, mapped and transition addresses", () => {
    for (const ip of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "100.64.0.1", "192.168.1.1", "::1", "::ffff:127.0.0.1", "fc00::1", "2002:7f00:1::"]) expect(isPublicAddress(ip)).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
  });
  it("rejects dangerous destinations before sending a request", async () => {
    for (const url of ["http://example.com", "https://user:pass@example.com", "https://127.1", "https://[::1]", "https://example.com:444"]) await expect(safeOutbound(url)).rejects.toThrow();
  });
  it("rejects HTML and truncated or malformed feeds before cancellations", () => {
    for (const value of ["<html>Unavailable</html>", "BEGIN:VCALENDAR", "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:x\nEND:VEVENT\nEND:VCALENDAR"]) expect(() => validateICal(value)).toThrow();
    expect(() => validateICal("BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR")).not.toThrow();
    expect(() => validateICal("BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:x\nDTSTART:20260908\nDTEND:20260909\nEND:VEVENT\nEND:VCALENDAR")).not.toThrow();
  });
});
