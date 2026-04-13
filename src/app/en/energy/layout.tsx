import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Tevaxia Energy — Energy Simulators Luxembourg Real Estate",
    template: "%s | Tevaxia Energy",
  },
  description:
    "Energy performance simulators for Luxembourg real estate. Energy class impact on value, renovation ROI, energy communities.",
};

export default function EnEnergyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
