/**
 * User profile types — multi-select stored in user_preferences.profile_types.
 * Drives the 'Mes espaces' grid filtering on /profil.
 *
 * Labels are i18n keys resolved by next-intl (namespace `profileTypes`).
 */

export type ProfileType =
  | "particulier"
  | "expert"
  | "syndic"
  | "hotelier"
  | "investisseur"
  | "agence"
  | "promoteur"
  | "api"
  | "str_operator";

export interface ProfileTypeMeta {
  value: ProfileType;
  /** Tailwind gradient classes e.g. "from-sky-500 to-blue-600" */
  color: string;
  /** Heroicon SVG path content (stroke paths, no <svg> wrapper) */
  iconPath: string;
}

export const PROFILE_TYPES: ProfileTypeMeta[] = [
  {
    value: "particulier",
    color: "from-sky-500 to-blue-600",
    iconPath:
      "M2.25 12l8.954-8.955a1.5 1.5 0 0 1 2.121 0L22.28 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    value: "expert",
    color: "from-indigo-500 to-violet-600",
    iconPath:
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487zm0 0L19.5 7.125",
  },
  {
    value: "syndic",
    color: "from-purple-500 to-pink-600",
    iconPath:
      "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3",
  },
  {
    value: "hotelier",
    color: "from-rose-500 to-orange-500",
    iconPath:
      "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21",
  },
  {
    value: "investisseur",
    color: "from-emerald-500 to-teal-600",
    iconPath:
      "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941",
  },
  {
    value: "agence",
    color: "from-cyan-500 to-sky-600",
    iconPath:
      "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
  },
  {
    value: "promoteur",
    color: "from-amber-500 to-orange-500",
    iconPath:
      "M2.25 21h19.5M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3",
  },
  {
    value: "api",
    color: "from-slate-500 to-slate-700",
    iconPath:
      "M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z",
  },
  {
    value: "str_operator",
    color: "from-fuchsia-500 to-pink-600",
    iconPath:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5v.008-.008Zm0 0a4.5 4.5 0 0 0-4.5 4.5v3h9v-3A4.5 4.5 0 0 0 12 7.5Z",
  },
];

/**
 * Map each workspace tile href to the set of profile types for which it is
 * relevant. If a user has no profile selected, all tiles show.
 */
export const WORKSPACE_PROFILE_MAP: Record<string, ProfileType[]> = {
  "mes-evaluations": ["particulier", "expert", "syndic", "hotelier", "investisseur", "agence", "promoteur", "str_operator"],
  "portfolio": ["investisseur", "expert", "agence", "promoteur"],
  "energy/portfolio": ["investisseur", "expert", "syndic", "promoteur"],
  "syndic/coproprietes": ["syndic"],
  "hotellerie/groupe": ["hotelier", "investisseur"],
  "str": ["str_operator", "particulier", "investisseur"],
  "profil/organisation": ["agence", "expert", "syndic"],
  "profil/api": ["api"],
  "api-docs": ["api", "investisseur", "agence"],
};

/**
 * Return true if the tile at `slug` should be shown for the given selection.
 * An empty or null selection means "show all".
 */
export function isWorkspaceVisible(slug: string, selected: ProfileType[] | null): boolean {
  if (!selected || selected.length === 0) return true;
  const relevantFor = WORKSPACE_PROFILE_MAP[slug];
  if (!relevantFor) return true;
  return selected.some((p) => relevantFor.includes(p));
}
