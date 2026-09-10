// UI suppression after confirmed account deletion. This does not revoke JWTs or
// clear a shared authentication cookie: doing that could sign out a newer user.
export const DELETED_AUTH_PREFIX = "tevaxia_deleted_account:v1:";
export const DELETED_AUTH_EVENT = "tevaxia-account-deleted";
const deletedInThisPage = new Set<string>();
export interface DeletedAuthNotice { owner: string; message: string }

export function deletedAuthKey(owner: string): string { return DELETED_AUTH_PREFIX + encodeURIComponent(owner); }
export function isDeletedAuthOwner(owner: string): boolean {
  if (deletedInThisPage.has(owner)) return true;
  try { return typeof window !== "undefined" && localStorage.getItem(deletedAuthKey(owner)) === "confirmed"; }
  catch { return false; }
}
export function visibleAuthUser<T extends { id: string }>(user: T | null): T | null {
  return user && !isDeletedAuthOwner(user.id) ? user : null;
}
export function markDeletedAuthOwner(owner: string, messages: { complete: string; partial: string }, cleanupComplete: boolean): boolean {
  if (!owner) throw new Error("Missing deleted account identity");
  deletedInThisPage.add(owner);
  let persisted = false;
  try { localStorage.setItem(deletedAuthKey(owner), "confirmed"); persisted = true; } catch { /* Keep the in-memory suppression and report incomplete local cleanup. */ }
  const complete = persisted && cleanupComplete;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<DeletedAuthNotice>(DELETED_AUTH_EVENT, { detail: { owner, message: complete ? messages.complete : messages.partial } }));
  return complete;
}
