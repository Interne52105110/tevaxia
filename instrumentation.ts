// Next.js instrumentation — charge Sentry selon le runtime courant.
// Se substitue aux fichiers sentry.{client,server,edge}.config.ts pour
// Next.js 15+, en les important conditionnellement.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
