// ============================================================
// CRM — Nurturing sequences (drip campaigns)
// ============================================================
//
// Définit des séquences automatiques de tâches de relance à planifier
// dans crm_tasks pour un contact. Pas d'envoi email automatique (nous
// n'avons pas de provider SMTP configuré) — l'agent reçoit une tâche
// avec email template pré-rempli à envoyer manuellement.

import { createTask } from "./tasks";
import type { EmailTemplate } from "./email-templates";
import { EMAIL_TEMPLATES } from "./email-templates";

export interface NurtureStep {
  delay_days: number;
  template_id: string; // référence EMAIL_TEMPLATES.id
  task_title: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface NurtureSequence {
  id: string;
  name: string;
  description: string;
  target: "prospect" | "acquereur" | "lead" | "all";
  steps: NurtureStep[];
}

export const NURTURE_SEQUENCES: NurtureSequence[] = [
  {
    id: "prospect_silent_30j",
    name: "Prospect silencieux (30 jours)",
    description: "Réactivation d'un prospect sans réponse depuis 30 jours. 2 relances espacées.",
    target: "prospect",
    steps: [
      { delay_days: 0, template_id: "reengagement",
        task_title: "Envoyer relance 'Un nouveau bien qui pourrait vous intéresser'",
        priority: "normal" },
      { delay_days: 14, template_id: "reengagement",
        task_title: "2e relance prospect — sélection ciblée 3-5 biens",
        priority: "high" },
    ],
  },
  {
    id: "post_visite_followup",
    name: "Post-visite (3 jours)",
    description: "Email de suivi 24h après visite puis relance si pas de retour à J+3.",
    target: "acquereur",
    steps: [
      { delay_days: 1, template_id: "visit_followup",
        task_title: "Email post-visite J+1 (demande avis)",
        priority: "high" },
      { delay_days: 3, template_id: "visit_followup",
        task_title: "Relance J+3 si pas de retour — proposer 2e visite",
        priority: "normal" },
      { delay_days: 7, template_id: "reengagement",
        task_title: "Dernière relance J+7 — proposer autres biens similaires",
        priority: "normal" },
    ],
  },
  {
    id: "acquereur_actif",
    name: "Acquéreur actif — suivi pré-compromis",
    description: "Accompagnement acquéreur engagé : rappels + étapes jusqu'au compromis.",
    target: "acquereur",
    steps: [
      { delay_days: 2, template_id: "welcome_prospect",
        task_title: "Appel J+2 — confirmer critères et accord bancaire",
        priority: "high" },
      { delay_days: 7, template_id: "visit_followup",
        task_title: "Organiser 2e visite ou contre-visite J+7",
        priority: "high" },
      { delay_days: 14, template_id: "offer_received",
        task_title: "Point J+14 — offre formelle ou décision",
        priority: "urgent" },
    ],
  },
  {
    id: "post_vente_satisfaction",
    name: "Post-vente satisfaction (3 mois)",
    description: "Contact 3 mois après l'acte pour satisfaction + demande recommandation/avis Google.",
    target: "all",
    steps: [
      { delay_days: 30, template_id: "post_sale_3m",
        task_title: "Email satisfaction J+30 + 1ère nouvelle",
        priority: "normal" },
      { delay_days: 90, template_id: "post_sale_3m",
        task_title: "Appel J+90 — demande avis Google + recommandation",
        priority: "normal" },
      { delay_days: 365, template_id: "post_sale_3m",
        task_title: "Anniversaire 1 an — suivi long terme",
        priority: "low" },
    ],
  },
  {
    id: "mandat_post_signature",
    name: "Post-signature mandat vendeur",
    description: "Suivi proactif du vendeur après signature mandat : reportings + relances.",
    target: "all",
    steps: [
      { delay_days: 7, template_id: "mandate_signed",
        task_title: "Reporting hebdo J+7 (nb visites, retours)",
        priority: "normal" },
      { delay_days: 14, template_id: "mandate_signed",
        task_title: "Reporting J+14 + ajustement si besoin",
        priority: "normal" },
      { delay_days: 45, template_id: "price_reduction",
        task_title: "Bilan J+45 — proposer ajustement prix si pas d'offre",
        priority: "high" },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

export function getSequence(id: string): NurtureSequence | null {
  return NURTURE_SEQUENCES.find((s) => s.id === id) ?? null;
}

export function getTemplateFromStep(step: NurtureStep): EmailTemplate | null {
  return EMAIL_TEMPLATES.find((t) => t.id === step.template_id) ?? null;
}

/**
 * Enrôle un contact dans une séquence : crée N tâches dans crm_tasks
 * avec due_at = now + delay_days pour chaque step. Le texte inclut une
 * référence au template email pour que l'agent puisse le récupérer.
 */
export async function enrollContact(
  contactId: string,
  sequenceId: string,
): Promise<{ ok: boolean; tasks_created: number; error?: string }> {
  const sequence = getSequence(sequenceId);
  if (!sequence) return { ok: false, tasks_created: 0, error: "sequence_not_found" };

  let created = 0;
  for (const step of sequence.steps) {
    const dueDate = new Date(Date.now() + step.delay_days * 86400000);
    const template = getTemplateFromStep(step);
    try {
      await createTask({
        title: step.task_title,
        description: template
          ? `Séquence : ${sequence.name}\nTemplate email : ${template.title} (id: ${template.id})\n\nOuvrir /pro-agences/crm/templates pour éditer et envoyer.`
          : `Séquence : ${sequence.name}`,
        priority: step.priority ?? "normal",
        dueAt: dueDate.toISOString(),
        contactId,
      });
      created++;
    } catch (e) {
      return { ok: false, tasks_created: created, error: (e as Error).message };
    }
  }
  return { ok: true, tasks_created: created };
}

export function estimateSequenceDuration(seq: NurtureSequence): number {
  return Math.max(0, ...seq.steps.map((s) => s.delay_days));
}
