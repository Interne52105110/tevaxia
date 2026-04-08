import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Erwan Bargain, REV TEGOVA real estate expert",
  description:
    "Luxembourg-based real estate valuation expert certified REV TEGOVA. 16 years of experience, 1,500+ valuations. Creator of tevaxia.lu and bargain-expertise.fr.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
