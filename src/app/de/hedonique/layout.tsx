import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Daten und Grenzen der Schätzung",
  description: "Indikative Schätzung mit internen Annahmen. Methodik vor Verwendung lesen.",
  alternates: localizedAlternates("/hedonique", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
