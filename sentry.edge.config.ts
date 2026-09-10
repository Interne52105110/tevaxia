// Configuration Sentry pour le runtime Edge (middleware Next.js)
import * as Sentry from "@sentry/nextjs";
import { DIAGNOSTIC_PRIVACY_OPTIONS } from "./src/lib/diagnostic-privacy";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV ?? process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    ...DIAGNOSTIC_PRIVACY_OPTIONS,
    debug: false,
  });
}
