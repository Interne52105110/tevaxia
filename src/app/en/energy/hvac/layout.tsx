import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Heating: compare needs, quotations and costs",description:"Compare two scenarios using entered heat needs, seasonal performance, prices and quotations. Initial values illustrate the method; they are neither measurements of your property nor commercial offers.",alternates:localizedAlternates("/energy/hvac","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
