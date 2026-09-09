import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Property valuation — scenarios and evidence",
  description: "Compare documented sales, capitalise income or discount cash flows, then choose weights suited to your file.",
  alternates: localizedAlternates("/valorisation", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
