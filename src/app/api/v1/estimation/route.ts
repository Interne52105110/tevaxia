import { NextResponse } from "next/server";
import { estimer } from "@/lib/estimation";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.commune || !body.surface) {
    return NextResponse.json({ success: false, error: "Missing required fields: commune, surface" }, { status: 400 });
  }

  try {
    const result = estimer(body);
    if (!result) {
      return NextResponse.json({ success: false, error: "Municipality not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: `Calculation error: ${message}` }, { status: 400 });
  }
}
