import { calculerMLV } from "@/lib/valuation";
import { handleCalculation } from "@/lib/api-utils";

export async function POST(request: Request) {
  return handleCalculation(request, calculerMLV, [
    "valeurMarche", "decoteConjoncturelle", "decoteCommercialisation", "decoteSpecifique",
  ]);
}
