import { calculerFraisAcquisition } from "@/lib/calculations";
import { handleCalculation } from "@/lib/api-utils";

export async function POST(request: Request) {
  return handleCalculation(request, calculerFraisAcquisition, [
    "prixBien", "estNeuf", "residencePrincipale", "nbAcquereurs",
  ]);
}
