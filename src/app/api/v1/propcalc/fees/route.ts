import { assertPropcalcApiInput, assertFinitePropcalcResult } from "@/lib/propcalc/api-input";
import { NextResponse } from 'next/server';
import { calculateAcquisitionFees } from '@/lib/propcalc/fees';
import { getCountryData, CORS_HEADERS } from '@/lib/propcalc/countries';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try { assertPropcalcApiInput(body, 'fees'); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof RangeError ? error.message : 'Invalid input' }, { status: 400, headers: CORS_HEADERS }); }

  const { country, price, isPrimary, isFirstTime, isNew, region, loanAmount, buyerAge } = body;

  if (!country || !price) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: country, price' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (typeof price !== 'number' || price <= 0) {
    return NextResponse.json(
      { success: false, error: 'price must be a positive number' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const countryData = getCountryData(country);
  if (!countryData) {
    return NextResponse.json(
      { success: false, error: `Unsupported country: ${country}` },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = calculateAcquisitionFees({
      propertyPrice: price,
      countryCode: country.toLowerCase(),
      regionCode: region ?? '',
      isNew: isNew ?? false,
      isPrimaryResidence: isPrimary ?? false,
      isFirstTimeBuyer: isFirstTime ?? false,
      loanAmount: loanAmount ?? 0,
      buyerAge: buyerAge ?? 0,
      countryData,
    });

    assertFinitePropcalcResult(result);

    return NextResponse.json(
      {
        success: true,
        assumptions: { isNew: isNew ?? false, isPrimary: isPrimary ?? false, isFirstTime: isFirstTime ?? false, region: region ?? null, loanAmount: loanAmount ?? 0, buyerAge: buyerAge ?? null, ...(country.toLowerCase() === 'fr' && !isNew ? { frenchTransferTax: { rateSnapshot: "2026-06-01", scope: "Ordinary residential transfer, no local exemptions; isFirstTime and isPrimary must apply to the entire acquired share. Mixed buyer eligibility is not modeled.", unlocatedDepartmentalRateAssumption: region ? null : (isFirstTime && isPrimary ? 0.045 : 0.05), source: "https://www.impots.gouv.fr/droits-denregistrement" } } : {}) },
        data: {
          currency: countryData.currency,
          totalFees: result.total,
          percentOfPrice: result.totalPercent,
          breakdown: result.items,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (e) {
    const message = e instanceof RangeError ? e.message : 'Unable to calculate this scenario';
    return NextResponse.json(
      { success: false, error: `Calculation error: ${message}` },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
