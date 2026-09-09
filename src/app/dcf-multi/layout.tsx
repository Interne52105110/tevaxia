import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF multi-locataires — flux mensuels attendus",
  description: "Scénario déterministe : les mêmes données produisent le même résultat. Les paramètres initiaux sont indicatifs et les exemples fictifs. Les flux mensuels sont regroupés par année et actualisés en fin d’année.",
  alternates: localizedAlternates("/dcf-multi", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
