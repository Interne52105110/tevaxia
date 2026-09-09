import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ: check classification thresholds",description:"Enter achievement percentages from your complete LENOZ file to check the ministry’s published thresholds. This page does not replace the expert’s assessment of the criteria.",alternates:localizedAlternates("/energy/lenoz","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
