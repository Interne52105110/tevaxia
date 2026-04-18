/**
 * Extrait un message lisible depuis n'importe quel type d'erreur.
 * Les erreurs Supabase (PostgrestError) sont des objets plats avec
 * { message, details, hint, code } et NE SONT PAS instanceof Error,
 * donc `String(err)` donne "[object Object]".
 */
export function errMsg(e: unknown): string {
  if (!e) return "Erreur inconnue";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;

  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.message === "string") parts.push(o.message);
    if (typeof o.code === "string" && o.code) parts.push(`[${o.code}]`);
    if (typeof o.details === "string" && o.details) parts.push(`— ${o.details}`);
    if (typeof o.hint === "string" && o.hint) parts.push(`(${o.hint})`);
    if (parts.length > 0) return parts.join(" ");
    try { return JSON.stringify(e); } catch { return "Erreur inconnue"; }
  }
  return String(e);
}
