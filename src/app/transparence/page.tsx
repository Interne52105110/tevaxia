import type { Metadata } from "next";
import { TransparenceClient } from "./client";

export const metadata: Metadata = {
  title: "Transparence du modèle d'estimation tevaxia",
  description:
    "Sources officielles des prix immobiliers, hypothèses de calcul et limites de l’estimation indicative tevaxia.",
};

export default function TransparencePage() {
  return <TransparenceClient />;
}
