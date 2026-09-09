import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF mat méi Locatairen — erwaart monatlech Fluxen",
  description: "Deterministescht Szenario: Déiselwecht Agabe ginn déiselwecht Resultater. Ufanksparameter sinn indikativ a Beispiller fiktiv. Monatsfluxe ginn op Joresbasis zesummegefaasst an um Joresenn diskontéiert.",
  alternates: localizedAlternates("/dcf-multi", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
