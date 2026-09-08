import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimation data and limitations",
  description: "Indicative estimate using internal assumptions. Read the methodology before use.",
  alternates: localizedAlternates("/hedonique", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
