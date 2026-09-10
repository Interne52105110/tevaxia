export type InspectionState = "" | "neuf" | "bon" | "usage" | "a_remplacer" | "non_applicable";
export interface RoomItem { id: string; label: string; state: InspectionState; notes: string }
export interface RoomSection { id: string; name: string; items: RoomItem[] }
export interface InspectionMeta { lotName: string; address: string; type: "entree" | "sortie"; date: string; bailleur: string; locataire: string }

export function inspectionProgress(sections: RoomSection[]) {
  const items = sections.flatMap(section => section.items);
  const done = items.filter(item => item.state !== "").length;
  return { done, total: items.length, pct: items.length ? Math.round(done / items.length * 100) : 0 };
}

/** Missing measurements remain unknown; an explicit zero is a recorded zero. */
export function validInspectionMeta(meta: InspectionMeta, keys: string): boolean {
  const date = new Date(`${meta.date}T12:00:00Z`);
  return [meta.address, meta.bailleur, meta.locataire].every(value => value.trim().length > 0 && value.length <= 300)
    && meta.lotName.length <= 300 && (meta.type === "entree" || meta.type === "sortie")
    && /^\d{4}-\d{2}-\d{2}$/.test(meta.date) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === meta.date
    && (keys === "" || (/^\d{1,3}$/.test(keys) && Number(keys) <= 999));
}
