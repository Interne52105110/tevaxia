import { calculerPlusValue } from "@/lib/calculations";
import { handleCalculation } from "@/lib/api-utils";

export async function POST(request: Request) {
  return handleCalculation(request, calculerPlusValue, [
    "prixAcquisition", "anneeAcquisition", "prixCession", "anneeCession",
  ]);
}
