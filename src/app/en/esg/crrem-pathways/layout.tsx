import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Compare energy and carbon trajectories",description:"Calculate intensities from a documented annual report, then compare a building scenario year by year with a reference trajectory you provide.",alternates:localizedAlternates("/esg/crrem-pathways","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
