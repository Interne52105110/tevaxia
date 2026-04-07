import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Convertisseur de surfaces Luxembourg — SCB, SCP, surface habitable ILNAS 101",
  description: "Conversion entre SCB, SCP, surface utile et surface habitable (ILNAS 101:2016). Pondération ACT pour balcons, caves, terrasses. Normes OAI FC.04.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
