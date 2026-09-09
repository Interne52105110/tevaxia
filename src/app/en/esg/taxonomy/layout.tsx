import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"EU Taxonomy: prepare a 7.7 review",description:"Acquisition and ownership of buildings, climate change mitigation. Check thresholds and gather supporting documents for a file review.",alternates:localizedAlternates("/esg/taxonomy","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
