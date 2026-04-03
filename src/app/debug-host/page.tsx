import { headers } from "next/headers";

/** Temporary diagnostic — delete after debugging energy subdomain */
export default async function DebugHostPage() {
  const h = await headers();
  const data = {
    host: h.get("host"),
    "x-forwarded-host": h.get("x-forwarded-host"),
    "x-url": h.get("x-url"),
    "x-energy-subdomain": h.get("x-energy-subdomain"),
    "x-vercel-deployment-url": h.get("x-vercel-deployment-url"),
    "x-forwarded-proto": h.get("x-forwarded-proto"),
    "x-real-ip": h.get("x-real-ip"),
    "x-vercel-id": h.get("x-vercel-id"),
  };

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
