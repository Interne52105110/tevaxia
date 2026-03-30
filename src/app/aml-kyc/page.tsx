"use client";

import { useState } from "react";
import ToggleField from "@/components/ToggleField";

interface CheckItem {
  id: string;
  categorie: string;
  label: string;
  description: string;
  obligatoire: boolean;
  reference: string;
}

const AML_CHECKLIST: CheckItem[] = [
  // Identification client
  { id: "id_1", categorie: "Identification du client", label: "Pièce d'identité vérifiée", description: "Passeport, carte d'identité ou titre de séjour en cours de validité", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_2", categorie: "Identification du client", label: "Justificatif de domicile", description: "Facture de moins de 3 mois ou attestation de résidence", obligatoire: true, reference: "Art. 3-2 Loi AML" },
  { id: "id_3", categorie: "Identification du client", label: "Bénéficiaire effectif identifié", description: "Si personne morale : registre RBE, organigramme, statuts", obligatoire: true, reference: "Art. 3-6 Loi AML" },
  { id: "id_4", categorie: "Identification du client", label: "Source des fonds vérifiée", description: "Origine des fonds pour l'acquisition (salaire, vente, héritage, emprunt)", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "id_5", categorie: "Identification du client", label: "Questionnaire PPE complété", description: "Vérification si le client est une Personne Politiquement Exposée ou proche d'une PPE", obligatoire: true, reference: "Art. 3-4 Loi AML" },

  // Vigilance renforcée
  { id: "vig_1", categorie: "Vigilance renforcée", label: "Screening listes de sanctions", description: "Vérification UE, ONU, OFAC, listes nationales", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_2", categorie: "Vigilance renforcée", label: "Pays à risque vérifié", description: "Vérifier si le client ou les fonds proviennent d'un pays à haut risque (liste GAFI)", obligatoire: true, reference: "Art. 3-3 Loi AML" },
  { id: "vig_3", categorie: "Vigilance renforcée", label: "Structure de propriété complexe analysée", description: "Si acquisition via SCI/SPV/holding : analyser la chaîne de détention", obligatoire: false, reference: "Art. 3-3(b) Loi AML" },
  { id: "vig_4", categorie: "Vigilance renforcée", label: "Transaction inhabituelle documentée", description: "Prix significativement au-dessus/en dessous du marché, paiement en espèces, urgence injustifiée", obligatoire: false, reference: "Art. 5 Loi AML" },

  // Documentation transaction
  { id: "doc_1", categorie: "Documentation transaction", label: "Compromis de vente vérifié", description: "Cohérence du prix avec le marché, conditions suspensives", obligatoire: true, reference: "Bonne pratique" },
  { id: "doc_2", categorie: "Documentation transaction", label: "Financement documenté", description: "Offre de prêt bancaire ou preuve de fonds propres", obligatoire: true, reference: "Art. 3-2(d) Loi AML" },
  { id: "doc_3", categorie: "Documentation transaction", label: "Registre des transactions tenu", description: "Conservation des documents 5 ans après la fin de la relation d'affaires", obligatoire: true, reference: "Art. 4 Loi AML" },

  // Déclaration
  { id: "decl_1", categorie: "Déclaration", label: "Évaluation du risque réalisée", description: "Profil de risque du client (faible / moyen / élevé) documenté", obligatoire: true, reference: "Art. 3-1 Loi AML" },
  { id: "decl_2", categorie: "Déclaration", label: "Formation AML à jour", description: "Personnel formé aux obligations LCB-FT (annuellement)", obligatoire: true, reference: "Art. 6 Loi AML" },
  { id: "decl_3", categorie: "Déclaration", label: "Responsable AML désigné", description: "Nom du responsable conformité AML au sein de l'organisation", obligatoire: true, reference: "Art. 4-1 Loi AML" },
];

export default function AmlKyc() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [...new Set(AML_CHECKLIST.map((c) => c.categorie))];
  const totalItems = AML_CHECKLIST.length;
  const checkedItems = Object.values(checks).filter(Boolean).length;
  const obligatoiresManquants = AML_CHECKLIST.filter((c) => c.obligatoire && !checks[c.id]);
  const pct = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">AML / KYC Immobilier</h1>
          <p className="mt-2 text-muted">
            Checklist anti-blanchiment pour les transactions immobilières au Luxembourg — Loi du 12 novembre 2004 modifiée
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy">Conformité AML/KYC</span>
            <span className={`text-sm font-bold ${pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-error"}`}>
              {checkedItems}/{totalItems} ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-error"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {obligatoiresManquants.length > 0 && (
            <p className="mt-2 text-xs text-error">{obligatoiresManquants.length} élément(s) obligatoire(s) manquant(s)</p>
          )}
        </div>

        {/* Checklist par catégorie */}
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">{cat}</h2>
              <div className="space-y-4">
                {AML_CHECKLIST.filter((c) => c.categorie === cat).map((item) => (
                  <div key={item.id} className={`rounded-lg border p-4 transition-colors ${checks[item.id] ? "border-success/30 bg-green-50/50" : "border-card-border"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          checks[item.id] ? "border-success bg-success text-white" : "border-input-border hover:border-navy"
                        }`}
                      >
                        {checks[item.id] && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${checks[item.id] ? "text-success line-through" : "text-slate"}`}>
                            {item.label}
                          </span>
                          {item.obligatoire && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Obligatoire</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted">{item.description}</p>
                        <p className="mt-1 text-[10px] text-muted italic">{item.reference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-3">Références réglementaires</h2>
          <div className="space-y-2 text-sm text-muted">
            <p><strong className="text-slate">Loi du 12 novembre 2004</strong> modifiée relative à la lutte contre le blanchiment et contre le financement du terrorisme (LCB-FT).</p>
            <p><strong className="text-slate">Règlement grand-ducal du 1er février 2010</strong> précisant les obligations professionnelles.</p>
            <p><strong className="text-slate">CSSF Circulaire 20/744</strong> sur les obligations AML des professionnels du secteur financier.</p>
            <p><strong className="text-slate">CRF (Cellule de Renseignement Financier)</strong> — Déclaration de soupçon : crf@justice.etat.lu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
