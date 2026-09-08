// Instrumentation Sentry côté client (chargée automatiquement par
// Next.js 15+ dans le bundle navigateur).
import * as Sentry from "@sentry/nextjs";

import "./sentry.client.config";

// Sans ce hook, le SDK ne rattache pas une erreur à la navigation qui l'a
// provoquée : l'alerte arrive avec l'URL de la page d'arrivée, pas celle où
// le problème est né. Le build le réclame explicitement.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
