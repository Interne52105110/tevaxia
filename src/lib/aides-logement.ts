import { BELLEGEN_AKT_PAR_PERSONNE } from './constants';

export const AIDES_SOURCES = {
  loi: 'https://logement.public.lu/dam-assets/documents/legislation/lois/aides-loi-07-08-2023-accessible.pdf',
  accession: 'https://logement.public.lu/fr/proprietaire/obtenir-aide-achat-construction/prime-accession-propriete.html',
  epargne: 'https://guichet.public.lu/fr/citoyens/logement/aides/aides-directes-capital/prime-epargne.html',
  interet: 'https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-interet/subvention-interet.html',
  bellegen: 'https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html',
  tva: 'https://pfi.public.lu/fr/citoyen/tva/logement.html',
  klima: 'https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html',
  energie: 'https://www.klima-agence.lu/fr',
};
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
// Moyenne des indices annuels 2024 et 2025. Les plafonds 2026 publiés par
// le ministère (52 233,65 € pour une personne seule) confirment cette base.
export const INDICE_MOYEN_ACCESSION_2026 = 952.30;
export const INDICE_MOYEN_INTERET_2026 = 960.17;

export interface AidesInput {
  typeProjet: 'acquisition' | 'construction' | 'renovation';
  prixBien: number;
  montantTravaux?: number;
  /** Ancien champ conservé ; jamais assimilé automatiquement au revenu légal. */
  revenuMenage: number;
  nbEmprunteurs: 1 | 2;
  nbEnfants: number;
  typeBien: 'appartement' | 'maison_rangee' | 'maison_jumelee' | 'maison_isolee';
  residencePrincipale: boolean;
  commune?: string;
  estNeuf: boolean;
  montantPret?: number;
  epargneReguliere3ans?: boolean;
  /** Ce module couvre les actes/demandes 2026 et le régime ordinaire. */
  anneeProjet?: number;
  nbAdultes?: number;
  revenuNet2024?: number;
  revenuNet2025?: number;
  conditionsAccessionConfirmees?: boolean;
  /** Soldes du pot de 35 000 € par bénéficiaire, après aides antérieures. */
  potsCapitalRestants?: number[];
  /** Accroissements réels annuels, par bénéficiaire, au plus dix années. */
  accroissementsEpargne?: number[][];
  conditionsEpargneConfirmees?: boolean;
  conditionsInteretConfirmees?: boolean;
  tauxPret?: number; // pourcentage, ex. 3.5
  nouveauPret?: boolean;
  creditsRestants?: number[];
  quotePartPremier?: number;
  baseDroits?: number;
  conditionsBellegenConfirmees?: boolean;
  baseTvaEligibleHT?: number;
  faveurTvaRestante?: number;
  conditionsTvaConfirmees?: boolean;
}
export interface AideDetail {
  id: 'bellegen' | 'accession' | 'epargne' | 'interet' | 'garantie' | 'tva' | 'klima' | 'conseil' | 'topup' | 'klimapret' | 'privee' | 'commune';
  nom: string;
  categorie: 'etatique_acquisition' | 'etatique_energie' | 'privee' | 'communale' | 'patrimoine';
  montant: number | null;
  description: string;
  conditions: string;
  nature: 'directe' | 'economie' | 'garantie';
  periodicite: 'unique' | 'mensuelle';
  source: string;
  lastVerified: string;
}
export interface AidesResult {
  aides: AideDetail[];
  totalParCategorie: Record<string, number>;
  totalAidesDirectes: number;
  totalEconomies: number;
  garantieEtat: { montantGaranti: number; economieEstimee: number } | null;
  /** Sous-total ponctuel seulement : ni mensualités, ni garanties, ni inconnus. */
  totalGeneral: number;
  aidesNonChiffrees: number;
  subventionMensuelle: number | null;
  estimationComplete: boolean;
}
function parametres(adultes: number, enfants: number) {
  if (!Number.isInteger(adultes) || adultes < 1 || !Number.isInteger(enfants) || enfants < 0) throw new RangeError('Composition du foyer invalide.');
  if (enfants === 0) return adultes === 1 ? { max: 5000, ri: 2805, rs: 5485 } : { max: 7000, ri: 4207, rs: 8227 };
  const n = Math.min(enfants, 3), extra = Math.max(0, enfants - 3);
  return { max: 7000 + enfants * 1000, ri: [0,5329,6451,7573][n] + extra * 841, rs: [0,10421,12615,14809][n] + extra * 1645 };
}
function nonnegative(n: number) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) throw new RangeError('Montant invalide.');
}
/** Articles 16,32 et annexe III ; hors pot personnel et conditions administratives. */
export function calculerPrimeAccession2026(revenuMoyen: number, adultes: number, enfants: number, type: AidesInput['typeBien']) {
  nonnegative(revenuMoyen);
  const p = parametres(adultes, enfants);
  // Plafonds monétaires tronqués au centime comme le tableau ministériel.
  if (revenuMoyen > Math.floor(p.rs * INDICE_MOYEN_ACCESSION_2026) / 100) return 0;
  const r = revenuMoyen * 100 / INDICE_MOYEN_ACCESSION_2026;
  const base = Math.min(p.max, p.max - (r - p.ri) / (p.rs - p.ri) * (p.max - 500));
  const majoration = type === 'appartement' || type === 'maison_rangee' ? 1.4 : type === 'maison_jumelee' ? 1.15 : 1;
  return round(base * majoration);
}
/** Articles 21 et annexe IV : taux annuel en points de pourcentage. */
export function calculerTauxSubvention2026(revenu2025: number, adultes: number, enfants: number, tauxPret: number) {
  nonnegative(revenu2025); nonnegative(tauxPret);
  const p = parametres(adultes, enfants), r = revenu2025 * 100 / INDICE_MOYEN_INTERET_2026;
  if (r > p.rs) return 0;
  const brut = Math.min(3.5, 3.5 - (r - p.ri) / (p.rs - p.ri) * 3.25);
  const taux = Math.floor((brut + 1e-10) * 8) / 8;
  const reduction = tauxPret < 1.5 ? Math.floor(((1.5 - tauxPret) / 2 + 1e-10) * 8) / 8 : 0;
  return Math.max(0, Math.min(tauxPret, taux - reduction));
}
export function simulerAides(input: AidesInput): AidesResult {
  nonnegative(input.prixBien); nonnegative(input.revenuMenage);
  for (const n of [input.prixBien, input.revenuMenage, input.montantTravaux, input.montantPret, input.revenuNet2024, input.revenuNet2025, input.baseDroits, input.baseTvaEligibleHT, input.faveurTvaRestante, input.tauxPret]) if (n !== undefined) nonnegative(n);
  if (!['acquisition','construction','renovation'].includes(input.typeProjet) || !['appartement','maison_rangee','maison_jumelee','maison_isolee'].includes(input.typeBien)
    || ![1,2].includes(input.nbEmprunteurs) || (input.anneeProjet !== undefined && input.anneeProjet !== 2026)
    || typeof input.residencePrincipale !== 'boolean' || typeof input.estNeuf !== 'boolean') throw new RangeError('Données du projet invalides.');
  for (const v of [input.conditionsAccessionConfirmees, input.conditionsEpargneConfirmees, input.conditionsInteretConfirmees, input.conditionsBellegenConfirmees, input.conditionsTvaConfirmees, input.nouveauPret]) if (v !== undefined && typeof v !== 'boolean') throw new RangeError('Confirmation invalide.');
  parametres(input.nbAdultes ?? input.nbEmprunteurs, input.nbEnfants);
  for (const [list,max] of [[input.creditsRestants,40000],[input.potsCapitalRestants,35000]] as const) if (list && (list.length !== input.nbEmprunteurs || list.some(n => !Number.isFinite(n) || n < 0 || n > max))) throw new RangeError('Soldes personnels invalides.');
  if (input.faveurTvaRestante !== undefined && input.faveurTvaRestante > 50000) throw new RangeError('Le solde de faveur TVA dépasse 50 000 €.');
  if (input.baseDroits !== undefined && input.baseDroits > input.prixBien) throw new RangeError('La base des droits dépasse le prix du bien.');
  const q = input.nbEmprunteurs === 1 ? 1 : (input.quotePartPremier ?? .5);
  if (!Number.isFinite(q) || q <= 0 || q > 1 || (input.nbEmprunteurs === 2 && q === 1)) throw new RangeError('Quote-part invalide.');
  const growth = input.accroissementsEpargne;
  if (growth && (growth.length !== input.nbEmprunteurs || growth.some(row => !Array.isArray(row) || row.length < 1 || row.length > 10 || row.some(n => !Number.isFinite(n))))) throw new RangeError('Renseignez une à dix années d’épargne par bénéficiaire.');
  const aides: AideDetail[] = [];
  const add = (id: AideDetail['id'], nom: string, montant: number | null, description: string, source: string, nature: AideDetail['nature'] = 'directe', categorie: AideDetail['categorie'] = 'etatique_acquisition', periodicite: AideDetail['periodicite'] = 'unique') => aides.push({ id, nom, montant, description, conditions: 'Estimation sous conditions ; décision de l’administration ou de l’organisme compétent.', source, nature, categorie, periodicite, lastVerified: '2026-09-08' });
  const acquisition = input.typeProjet !== 'renovation';
  const rp = input.residencePrincipale;
  const adultes = input.nbAdultes ?? input.nbEmprunteurs;
  let prime: number | null = null;
  let primesPersonnelles: number[] | null = null;
  if (rp && acquisition) {
    let credit: number | null = null;
    if (input.conditionsBellegenConfirmees && input.creditsRestants && input.baseDroits !== undefined) {
      const droits = round(input.baseDroits * .07), parts = input.nbEmprunteurs === 1 ? [1] : [q, 1-q];
      const imputable = parts.reduce((sum, part, i) => sum + Math.min(input.creditsRestants![i], BELLEGEN_AKT_PAR_PERSONNE, droits * part), 0);
      credit = round(Math.min(imputable, Math.max(0, droits - 100)));
    }
    add('bellegen', 'Bëllegen Akt', credit, 'Crédit personnel restant, quotes-parts et assiette des droits requis. Minimum de perception de 100 €. Déjà intégré aux frais d’acquisition : ne pas le déduire deux fois.', AIDES_SOURCES.bellegen, 'economie');
    if (input.conditionsAccessionConfirmees && input.revenuNet2024 !== undefined && input.revenuNet2025 !== undefined && (input.revenuNet2024 > 0 || input.revenuNet2025 === 0) && input.potsCapitalRestants) {
      const brut = (input.montantPret ?? 0) > 0 && input.revenuNet2025 > 0 ? calculerPrimeAccession2026((input.revenuNet2024 + input.revenuNet2025) / 2, adultes, input.nbEnfants, input.typeBien) : 0;
      primesPersonnelles = input.potsCapitalRestants.map(pot => Math.min(pot, brut / input.nbEmprunteurs));
      prime = round(primesPersonnelles.reduce((s,n) => s+n, 0));
    }
    add('accession', "Prime d'accession à la propriété", prime, 'Acte 2026 : moyenne nette 2024/2025, composition du foyer, type de bien et pot personnel restant. Cas ordinaires avec revenus pendant les deux années.', AIDES_SOURCES.accession);
    let saving: number | null = null;
    if (prime === 0) saving = 0;
    else if (prime !== null && primesPersonnelles && growth && input.conditionsEpargneConfirmees && input.potsCapitalRestants) {
      saving = round(growth.reduce((total, row, i) => total + Math.min(Math.max(0, input.potsCapitalRestants![i] - primesPersonnelles![i]), row.reduce((s,n) => s + Math.min(500, Math.max(0,n) * .1), 0)), 0));
    }
    add('epargne', "Prime d'épargne", saving, '10 % de l’accroissement annuel réel, maximum 500 €/an et dix ans par bénéficiaire. Prime d’accession préalable, épargne depuis au moins un an et 90 % investis dans les délais. Pot de 35 000 € partagé avec les autres aides en capital.', AIDES_SOURCES.epargne);
  }
  if (rp && (input.montantPret ?? 0) > 0) {
    let mensualite: number | null = null;
    if (input.conditionsInteretConfirmees && input.nouveauPret && input.revenuNet2025 !== undefined && input.tauxPret !== undefined) {
      const taux = calculerTauxSubvention2026(input.revenuNet2025, adultes, input.nbEnfants, input.tauxPret);
      const capital = Math.min(input.montantPret!, 200000 + input.nbEnfants * 20000, 280000);
      const brut = capital * taux / 100 / 12;
      mensualite = brut < 10 ? 0 : round(brut);
    }
    add('interet', "Subvention d'intérêt", mensualite, 'Mensualité initiale indicative pour un nouveau prêt et un nouveau droit à l’aide. Taux selon revenu net 2025, arrondi au huitième de point ; capital plafonné. Réexamen et amortissement légal : aucune projection sur 25 ans.', AIDES_SOURCES.interet, 'economie', 'etatique_acquisition', 'mensuelle');
    add('garantie', "Garantie de l'État", null, 'Caution publique à demander par la banque, soumise au revenu, à l’épargne et au financement. Ce n’est ni une subvention versée ni une économie forfaitaire de frais.', AIDES_SOURCES.loi, 'garantie');
  }
  const travaux = (input.montantTravaux ?? 0) > 0 || input.typeProjet === 'renovation';
  if ((rp && (input.estNeuf || input.typeProjet === 'construction')) || travaux) {
    const tva = input.conditionsTvaConfirmees && input.baseTvaEligibleHT !== undefined && input.faveurTvaRestante !== undefined ? round(Math.min(input.baseTvaEligibleHT * .14, input.faveurTvaRestante)) : null;
    add('tva', 'TVA logement à 3 %', tva, 'Différence 17 % / 3 % uniquement sur les travaux HT éligibles. Plafond de faveur restant partagé par logement entre construction et rénovation. Ne pas déduire à nouveau un avantage déjà inclus dans un prix TTC.', AIDES_SOURCES.tva, 'economie');
  }
  // Les aides énergétiques ne sont pas réservées aux propriétaires occupants.
  if (travaux) {
    add('klima', 'Klimabonus', null, 'Le budget global ne suffit pas : régime selon dates, surfaces, performances, matériaux, équipements et plafonds techniques. Demande d’accord préalable selon le dispositif.', AIDES_SOURCES.klima, 'directe', 'etatique_energie');
    add('conseil', 'Conseil en énergie', null, 'Aide selon mission, bâtiment, honoraires et régime applicable ; aucun forfait universel ajouté automatiquement.', AIDES_SOURCES.klima, 'directe', 'etatique_energie');
    if (rp) {
      add('topup', 'Complément Klimabonus', null, 'Calcul selon revenu, foyer et montant de l’aide étatique admissible ; jamais un pourcentage automatique du budget des travaux.', AIDES_SOURCES.loi, 'directe', 'etatique_energie');
      add('klimapret', 'Prêt climatique', null, 'Financement et subvention d’intérêt à examiner avec la banque et le Guichet unique. Un prêt n’est pas une aide en espèces et ne garantit pas un taux bancaire de 1,5 %.', AIDES_SOURCES.loi, 'garantie', 'etatique_energie');
    }
    add('privee', 'Primes des fournisseurs d’énergie', null, 'Offre à obtenir avant engagement selon les travaux et le fournisseur. Aucun taux général de 5 %.', AIDES_SOURCES.energie, 'directe', 'privee');
    add('commune', 'Aides communales', null, 'Règlement propre à la commune et à la mesure, avec assiette et plafond spécifiques. Une commune non renseignée ne donne pas droit à une prime forfaitaire.', AIDES_SOURCES.energie, 'directe', 'communale');
  }
  const totalParCategorie: Record<string, number> = {};
  let totalAidesDirectes = 0, totalEconomies = 0;
  for (const a of aides) if (a.montant !== null && a.periodicite === 'unique' && a.nature !== 'garantie') {
    totalParCategorie[a.categorie] = round((totalParCategorie[a.categorie] ?? 0) + a.montant);
    if (a.nature === 'directe') totalAidesDirectes += a.montant; else totalEconomies += a.montant;
  }
  const aidesNonChiffrees = aides.filter(a => a.montant === null).length;
  return { aides, totalParCategorie, totalAidesDirectes: round(totalAidesDirectes), totalEconomies: round(totalEconomies), totalGeneral: round(totalAidesDirectes + totalEconomies), garantieEtat: null, aidesNonChiffrees, subventionMensuelle: aides.find(a => a.id === 'interet')?.montant ?? null, estimationComplete: aidesNonChiffrees === 0 };
}
