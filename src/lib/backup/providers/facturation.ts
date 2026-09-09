/**
 * Provider: facturation — données de facturation enregistrées.
 */

import type { ExportProvider, ExportContext, BackupBundle } from "../types";
import { listHistory } from "@/lib/facturation/history";

async function collect(ctx: ExportContext): Promise<BackupBundle> {
  const history = await listHistory(500, ctx.userId);
  const files: Record<string, string> = {
    "factur_x_history.json": JSON.stringify(history, null, 2),
  };
  return { files, counts: { factur_x: history.length } };
}

export const facturationProvider: ExportProvider = {
  module: "facturation",
  collect,
};
