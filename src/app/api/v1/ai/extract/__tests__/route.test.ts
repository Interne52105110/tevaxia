import { describe, it, expect, beforeEach, vi } from "vitest";

// Default mock: user is authenticated, has BYOK OpenAI key.
vi.mock("@supabase/supabase-js", () => {
  const settings = {
    ai_provider: "openai",
    ai_api_key_encrypted: "sk-test-openai",
    daily_usage: 0,
    last_usage_date: "2020-01-01",
  };
  const maybeSingle = vi.fn().mockResolvedValue({ data: settings });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const fromFn = vi.fn().mockReturnValue({ select, upsert });
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } });
  return {
    createClient: vi.fn().mockReturnValue({
      from: fromFn,
      auth: { getUser },
    }),
  };
});

import { OPTIONS, POST } from "@/app/api/v1/ai/extract/route";

function req(headers: Record<string, string> = {}, body?: unknown): Request {
  return new Request("https://tevaxia.lu/api/v1/ai/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const tinyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("POST /api/v1/ai/extract", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    vi.restoreAllMocks();
  });

  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("401 when no auth header", async () => {
    const res = await POST(req({}, { schema: "bilan_promoteur", fileBase64: tinyBase64, mediaType: "image/png" }));
    expect(res.status).toBe(401);
  });

  it("400 when required fields missing", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { schema: "bilan_promoteur" }));
    expect(res.status).toBe(400);
  });

  it("400 when schema name is unknown", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      schema: "does_not_exist",
      fileBase64: tinyBase64,
      mediaType: "image/png",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Schema inconnu/);
  });

  it("413 when file is too large", async () => {
    // 10 MB base64 (over the 8 MB raw limit after decoding)
    const big = "A".repeat(15 * 1024 * 1024);
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      schema: "bilan_promoteur",
      fileBase64: big,
      mediaType: "application/pdf",
    }));
    expect(res.status).toBe(413);
  });

  it("200 with extracted JSON on happy path (mocked OpenAI vision)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: '{"surfaceVendable": 2000, "prixVenteM2": 8500}' } }],
      }), { status: 200 }),
    );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      schema: "bilan_promoteur",
      fileBase64: tinyBase64,
      mediaType: "image/png",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ surfaceVendable: 2000, prixVenteM2: 8500 });
    expect(json.provider).toBe("openai");
  });

  it("400 when OpenAI BYOK but PDF (vision mismatch)", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      schema: "bilan_promoteur",
      fileBase64: tinyBase64,
      mediaType: "application/pdf",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/OpenAI/);
  });
});
