// Veille Mémorial A — aides et législation logement LU
// Curation manuelle (mise à jour à chaque nouvelle session benchmark).
// Source primaire : https://legilux.public.lu (Journal officiel du Grand-Duché).

export interface MemorialEntry {
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  category: "klimabonus" | "aides" | "bail" | "copropriete" | "fiscal" | "urbanisme";
  url: string;
  impact: "nouveau" | "modification" | "abrogation";
}

// Ne conserver que des changements documentés par une source précise.
export const MEMORIAL_WATCH: MemorialEntry[] = [
  { date: "2026-01-01", title: "Aides individuelles au logement : nouvelles dispositions 2026", summary: "Adaptation de la définition du revenu net et clarification de conditions d’octroi. Se référer au texte coordonné et aux démarches officielles.", category: "aides", url: "https://logement.public.lu/dam-assets/documents/legislation/lois/aides-loi-07-08-2023-accessible.pdf", impact: "modification" },
  { date: "2025-07-03", title: "Bëllegen Akt : plafond individuel de 40 000 euros", summary: "Le crédit d’impôt personnel de 40 000 euros est pérennisé ; les droits restant dus et les conditions d’occupation restent applicables.", category: "fiscal", url: "https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html", impact: "modification" },
];
export const MEMORIAL_LAST_UPDATED = "2026-09-08";
