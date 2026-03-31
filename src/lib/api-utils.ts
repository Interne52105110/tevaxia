import { NextResponse } from "next/server";

export async function handleCalculation<T>(
  request: Request,
  calculFn: (input: T) => unknown,
  requiredFields?: string[]
) {
  let body: T;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  // Basic validation: check required fields exist
  if (requiredFields) {
    const missing = requiredFields.filter((f) => (body as Record<string, unknown>)[f] === undefined);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
  }

  try {
    const result = calculFn(body);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown calculation error";
    return NextResponse.json({ success: false, error: `Calculation error: ${message}` }, { status: 400 });
  }
}
