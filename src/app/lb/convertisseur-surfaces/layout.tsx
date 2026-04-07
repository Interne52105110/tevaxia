import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Flächen-Ëmrechner Lëtzebuerg — BGF, GF, Wunnfläch ILNAS 101",
  description: "Ëmrechnung tëscht BGF, Geschossfläch, Notzfläch a Wunnfläch (ILNAS 101:2016). ACT-Gewiichtung fir Balkonen, Keller, Terrassen. OAI FC.04 Normen.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
