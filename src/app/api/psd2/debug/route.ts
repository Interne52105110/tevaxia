import { NextResponse } from "next/server";

// Never expose signing material or a reusable banking token over HTTP.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}
