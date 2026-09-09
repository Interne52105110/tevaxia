"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import RelatedTools from "@/components/RelatedTools";
import LoanPlanning from "@/components/LoanPlanning";
import LoanOffers, {LoanRateSources} from "@/components/LoanOffers";
import MortgageConditions from "@/components/MortgageConditions";
import BankingBasics from "@/components/BankingBasics";
type ActiveTab = "ltv" | "capacite" | "amortissement" | "dscr" | "cpe" | "remboursement" | "comparateur";

export default function OutilsBancaires() {
  const t = useTranslations("outilsBancaires");
  const [activeTab, setActiveTab] = useState<ActiveTab>("ltv");

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "ltv", label: t("tabLtv") },
    { id: "capacite", label: t("tabCapacite") },
    { id: "amortissement", label: t("tabAmortissement") },
    { id: "dscr", label: t("tabDscr") },
    { id: "cpe", label: t("tabCpe") },
    { id: "remboursement", label: t("tabRemboursement") },
    { id: "comparateur", label: t("tabComparateur") },
  ];

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "ltv" && <BankingBasics kind="ltv" />}
        {activeTab === "capacite" && <LoanPlanning kind="capacity" />}
        {activeTab === "amortissement" && <BankingBasics kind="amortization" />}
        {activeTab === "dscr" && <BankingBasics kind="dscr" />}
        {activeTab === "cpe" && <MortgageConditions />}
        {activeTab === "remboursement" && <LoanPlanning kind="prepayment" />}
        {activeTab === "comparateur" && <LoanOffers />}

        {/* Historique taux BCE / OAT / hypothécaire */}
        <div className="mt-8"><LoanRateSources /></div>

        <RelatedTools keys={["achatLocation", "frais", "aides", "estimation"]} />
      </div>


    </div>
  );
}
