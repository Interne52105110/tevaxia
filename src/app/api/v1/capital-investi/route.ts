import { calculerCapitalInvesti } from "@/lib/calculations";
import { handleCalculation } from "@/lib/api-utils";

export async function POST(request: Request) {
  return handleCalculation(request, (input: Parameters<typeof calculerCapitalInvesti>[0]) => {
    const result = calculerCapitalInvesti(input);
    if (result.erreurSaisie) throw new RangeError(result.erreurSaisie);
    return result;
  }, [
    "prixAcquisition", "anneeAcquisition", "anneeBail", "surfaceHabitable",
  ]);
}
