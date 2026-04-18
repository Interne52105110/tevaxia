// ============================================================
// CRM — Email templates library
// ============================================================
//
// 10 modèles d'emails pré-rédigés pour les situations commerciales
// courantes d'un agent immobilier. Chaque template a des variables
// substituées au runtime via {variable_name}.
//
// Variables standards :
//   {prenom} {nom} {agence} {agent_nom} {bien} {commune} {prix}
//   {date_visite} {date_rdv} {signature}
//
// Les templates sont pur TypeScript (pas de DB) — maintenables par
// l'équipe et versionnables via git.

export type TemplateCategory =
  | "prospect" | "visite" | "mandat" | "offre"
  | "compromis" | "vente" | "relance" | "service_apres_vente";

export interface EmailTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  description: string;
  subject: string;
  body: string;
  variables: string[]; // pour auto-détection
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  prospect: "Prospection",
  visite: "Visite",
  mandat: "Mandat",
  offre: "Offre",
  compromis: "Compromis",
  vente: "Vente",
  relance: "Relance",
  service_apres_vente: "Service après-vente",
};

export const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  prospect: "bg-blue-100 text-blue-900",
  visite: "bg-indigo-100 text-indigo-900",
  mandat: "bg-emerald-100 text-emerald-900",
  offre: "bg-amber-100 text-amber-900",
  compromis: "bg-orange-100 text-orange-900",
  vente: "bg-green-100 text-green-900",
  relance: "bg-rose-100 text-rose-900",
  service_apres_vente: "bg-slate-100 text-slate-700",
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome_prospect",
    category: "prospect",
    title: "Bienvenue nouveau prospect",
    description: "Premier email suite à inscription newsletter ou contact formulaire web.",
    subject: "Bienvenue chez {agence}, {prenom}",
    body: `Bonjour {prenom},

Merci de l'intérêt que vous portez à notre agence. Nous sommes ravis de pouvoir vous accompagner dans votre projet immobilier au Luxembourg.

Votre conseiller dédié est {agent_nom}. Il reviendra vers vous sous 24 heures pour un premier échange et comprendre précisément vos critères (zone, budget, type de bien).

En attendant, si vous souhaitez recevoir nos actualités immobilières LU (nouveautés, analyses marché), inscrivez-vous via ce lien.

Cordialement,
{signature}`,
    variables: ["prenom", "agence", "agent_nom", "signature"],
  },
  {
    id: "visit_confirmation",
    category: "visite",
    title: "Confirmation visite",
    description: "Confirmation d'un rendez-vous de visite programmé.",
    subject: "Confirmation visite {bien} — {date_rdv}",
    body: `Bonjour {prenom},

Je confirme notre rendez-vous pour la visite du bien :
{bien}
{commune}

Date et heure : {date_rdv}

Pour préparer au mieux cette visite, n'hésitez pas à :
• Préparer vos questions sur les charges, DPE, travaux éventuels
• Venir si possible avec la personne qui décidera avec vous
• Prévoir 45 minutes minimum

Si besoin d'annuler ou déplacer, merci de me prévenir 24h avant.

À très vite,
{signature}`,
    variables: ["prenom", "bien", "commune", "date_rdv", "signature"],
  },
  {
    id: "visit_followup",
    category: "visite",
    title: "Suivi post-visite",
    description: "Email de suivi 24h après une visite pour recueillir le retour acquéreur.",
    subject: "Votre avis sur la visite de {bien}",
    body: `Bonjour {prenom},

Merci d'avoir pris le temps de visiter le bien {bien} hier.

Votre avis m'intéresse pour affiner mes propositions :
1. Qu'avez-vous apprécié ?
2. Qu'est-ce qui pourrait être un frein ?
3. Ce bien correspond-il à votre budget / zone ?
4. Souhaitez-vous une seconde visite ou des informations complémentaires ?

N'hésitez pas à répondre en 2-3 lignes — ça m'aide énormément pour vous présenter les biens les plus pertinents.

Cordialement,
{signature}`,
    variables: ["prenom", "bien", "signature"],
  },
  {
    id: "mandate_signed",
    category: "mandat",
    title: "Mandat signé — merci",
    description: "Remerciement au mandant après signature du mandat.",
    subject: "Mandat signé pour {bien} — merci de votre confiance",
    body: `Bonjour {prenom},

Je vous remercie pour votre confiance : le mandat pour la mise en vente de {bien} est officiellement signé.

Prochaines étapes dans les 7 jours :
• Prise de photos professionnelles et réalisation d'un descriptif complet
• Diffusion sur athome.lu, Immotop.lu, Immoweb et notre site agence
• Export OpenImmo vers portails européens (visibilité frontaliers FR/DE/BE)
• Planification de la première vague de visites

Vous recevrez un reporting hebdomadaire des activités (visites, demandes, retours).

Prix net vendeur : {prix}

À bientôt pour les premières visites,
{signature}`,
    variables: ["prenom", "bien", "prix", "signature"],
  },
  {
    id: "offer_received",
    category: "offre",
    title: "Offre reçue — information vendeur",
    description: "Notification au vendeur qu'une offre vient d'être reçue.",
    subject: "Offre reçue pour {bien}",
    body: `Bonjour {prenom},

Excellente nouvelle : nous avons reçu une offre d'achat pour votre bien {bien}.

Détails de l'offre (communication formelle à suivre) :
• Montant : {prix}
• Candidats acquéreurs : couple/famille/investisseur — à préciser
• Conditions suspensives principales : obtention du prêt, délai précis dans le document

Je vous propose un entretien téléphonique ou visio dans les 48h pour discuter :
1. Votre position sur le montant proposé
2. Les conditions suspensives acceptables pour vous
3. Une éventuelle contre-proposition

Quand êtes-vous disponible ?

{signature}`,
    variables: ["prenom", "bien", "prix", "signature"],
  },
  {
    id: "compromis_scheduled",
    category: "compromis",
    title: "Compromis programmé",
    description: "Confirmation du rendez-vous signature compromis chez le notaire.",
    subject: "Compromis {bien} — signature le {date_rdv}",
    body: `Bonjour {prenom},

Le rendez-vous de signature du compromis de vente est fixé :

📍 Étude notariale : Maître XYZ, adresse
🗓 Date : {date_rdv}
⏱ Durée prévue : 1h

Documents à apporter :
• Pièce d'identité valide
• Justificatif de domicile < 3 mois
• Accord de financement bancaire si obtenu
• Bëllegen Akt : attestation d'enregistrement si applicable

Les frais de notaire + droits d'enregistrement sont payables à la signature de l'acte authentique (pas au compromis). Acompte typique : 10% du prix séquestré chez le notaire.

Je serai présent(e) à la signature pour vous accompagner.

Cordialement,
{signature}`,
    variables: ["prenom", "bien", "date_rdv", "signature"],
  },
  {
    id: "sale_closed",
    category: "vente",
    title: "Félicitations — acte signé",
    description: "Message après signature de l'acte authentique.",
    subject: "🎉 Félicitations pour votre nouveau bien",
    body: `Bonjour {prenom},

Bravo, vous voici officiellement propriétaire de {bien} ! Un grand moment dans votre parcours.

Quelques points de vigilance à ne pas oublier dans les semaines à venir :
• Souscrire assurance habitation avant emménagement (obligation légale LU)
• Changer nom compteurs eau / électricité / gaz
• Déclarer votre nouvelle adresse à la commune (15 jours)
• Notification à votre banque pour le prélèvement des charges copro
• Conserver précieusement l'acte notarié (original + copie scanée)

Pour toute question post-vente, notre agence reste à votre disposition.

Nous serions ravis si vous prenez 1 minute pour laisser un avis Google sur notre agence — c'est le meilleur moyen de nous soutenir.

Bonne installation,
{signature}`,
    variables: ["prenom", "bien", "signature"],
  },
  {
    id: "reengagement",
    category: "relance",
    title: "Relance prospect silencieux",
    description: "Réactivation d'un prospect sans réponse depuis 30j.",
    subject: "Un nouveau bien qui pourrait vous intéresser, {prenom}",
    body: `Bonjour {prenom},

Nous n'avons plus eu d'échanges depuis quelques semaines. J'espère que votre projet immobilier avance bien.

Quelques nouveautés marché LU que vous pourriez trouver intéressantes :
• Plusieurs biens correspondant à vos critères viennent d'arriver au catalogue
• Les taux de crédit LU ont légèrement baissé (impact sur votre capacité d'emprunt)
• La taxe Bëllegen Akt reste à 3,5 % des frais d'enregistrement

Souhaitez-vous que je vous envoie une sélection ciblée de 3-5 biens correspondant à votre profil ? Je peux également organiser une visite groupée rapide si plusieurs vous plaisent.

Il suffit de répondre "oui" à cet email.

Cordialement,
{signature}`,
    variables: ["prenom", "signature"],
  },
  {
    id: "price_reduction",
    category: "vente",
    title: "Proposition baisse de prix mandat",
    description: "Suggestion tactique au vendeur d'ajuster le prix après X semaines sans offre.",
    subject: "Proposition d'ajustement du prix — {bien}",
    body: `Bonjour {prenom},

Votre bien {bien} est diffusé depuis plusieurs semaines. Le bilan actuel :
• Diffusion sur 3+ portails LU majeurs (athome, Immotop, Immoweb)
• X visites réalisées à ce jour
• Retour typique acquéreurs : "bien intéressant mais prix un peu élevé pour la zone"

Le prix de marché moyen en {commune} pour un bien similaire se situe actuellement entre Y et Z €/m². Votre annonce est positionnée légèrement au-dessus.

Ma recommandation pour déclencher des offres :
• Option A : ajustement de -3% à -5% (effet immédiat sur algos portails)
• Option B : maintien du prix avec publication d'un reportage photo/vidéo haut de gamme
• Option C : attendre 4 semaines de plus avec diffusion renforcée

Je reste à disposition pour en discuter à l'oral.

Cordialement,
{signature}`,
    variables: ["prenom", "bien", "commune", "signature"],
  },
  {
    id: "post_sale_3m",
    category: "service_apres_vente",
    title: "Suivi 3 mois post-acquisition",
    description: "Contact 3 mois après l'acte pour satisfaction + demande recommandation.",
    subject: "Comment se passe l'installation ?",
    body: `Bonjour {prenom},

Cela fait maintenant trois mois que vous êtes dans votre nouveau logement. J'espère que l'installation s'est bien déroulée et que vous profitez pleinement de votre bien.

Si vous avez :
• Des questions sur votre copropriété, syndic, charges courantes
• Un besoin d'adresse artisan fiable (plombier, électricien, peintre)
• Un projet de rénovation pour lequel mon réseau pourrait vous orienter

N'hésitez pas à me contacter — l'accompagnement post-vente fait partie de notre relation.

Si notre travail vous a convenu, recommander notre agence à vos proches est le plus beau compliment. Nous offrons une remise de 10% à toute personne que vous nous envoyez et qui nous confie un mandat.

Au plaisir de vous recroiser,
{signature}`,
    variables: ["prenom", "signature"],
  },
];

// ============================================================
// Helpers
// ============================================================

export function renderTemplate(template: EmailTemplate, vars: Record<string, string>): {
  subject: string; body: string;
} {
  const render = (s: string): string =>
    s.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  return {
    subject: render(template.subject),
    body: render(template.body),
  };
}

export function buildMailto(
  template: EmailTemplate,
  recipientEmail: string,
  vars: Record<string, string>,
): string {
  const { subject, body } = renderTemplate(template, vars);
  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function templatesByCategory(): Record<TemplateCategory, EmailTemplate[]> {
  const out = {
    prospect: [], visite: [], mandat: [], offre: [],
    compromis: [], vente: [], relance: [], service_apres_vente: [],
  } as Record<TemplateCategory, EmailTemplate[]>;
  for (const t of EMAIL_TEMPLATES) out[t.category].push(t);
  return out;
}
