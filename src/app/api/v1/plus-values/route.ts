import { calculerPlusValue } from "@/lib/calculations";
import { handleCalculation } from "@/lib/api-utils";

export async function POST(request: Request) {
  return handleCalculation(request, (input: Parameters<typeof calculerPlusValue>[0]) => {
    const result=calculerPlusValue(input);
    if(result.erreurSaisie)throw new RangeError(result.erreurSaisie);
    return result;
  }, [
    "prixAcquisition", "anneeAcquisition", "prixCession", "anneeCession", "dateAcquisition", "dateCession", "revenuImposable",
  ]);
}
