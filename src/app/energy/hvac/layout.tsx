import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Chauffage : comparer besoins, devis et coûts",description:"Comparez deux scénarios à partir de besoins de chaleur, performances saisonnières, tarifs et devis renseignés. Les valeurs initiales illustrent la méthode ; elles ne sont ni des mesures de votre bien ni des offres commerciales.",alternates:localizedAlternates("/energy/hvac","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
