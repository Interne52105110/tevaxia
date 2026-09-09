import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Multi-tenant DCF — expected monthly cash flows",
  description: "Deterministic scenario: identical inputs give identical results. Initial parameters are indicative and examples fictional. Monthly flows are grouped by year and discounted at year-end.",
  alternates: localizedAlternates("/dcf-multi", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
