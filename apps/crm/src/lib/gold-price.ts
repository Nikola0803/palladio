const TROY_OUNCE_IN_GRAMS = 31.1035;

type GoldPriceResult = {
  eurPoUnci: number;
  eurPoGramu925: number;
  eurPoGramu750: number;
  eurPoGramu585: number;
};

/**
 * Fetches live XAU spot in EUR from api.goldprice.dev and derives per-gram
 * prices at the purities we actually work with (925 / 750 / 585).
 *
 * Works without a key (free anonymous tier, lower rate limit — 30/day per
 * their header notice). Pass a ga_live_... key (from goldprice.dev/onboarding)
 * for the higher quota; it's sent as a Bearer token, not a query param.
 *
 * NOTE: this is api.goldprice.dev — NOT the unrelated data-asg.goldprice.org
 * endpoint, which now blocks non-browser traffic with a 403 regardless of
 * any key. Easy to confuse since both are branded "goldprice".
 */
export async function fetchGoldPrice(apiKeyOverride?: string): Promise<GoldPriceResult> {
  const key = apiKeyOverride || process.env.GOLDPRICE_API_KEY;

  const res = await fetch("https://api.goldprice.dev/v1/prices?symbol=XAU-EUR-SPOT", {
    cache: "no-store",
    headers: key ? { Authorization: `Bearer ${key}` } : undefined,
  });

  if (!res.ok) {
    throw new Error(`goldprice.dev request failed: ${res.status}`);
  }

  const data = await res.json();
  const eurPoUnci: number = Number(data.symbols?.[0]?.price);

  if (!eurPoUnci) {
    throw new Error("Unexpected response shape from goldprice.dev");
  }

  const eurPoGramuCisto = eurPoUnci / TROY_OUNCE_IN_GRAMS;

  return {
    eurPoUnci,
    eurPoGramu925: round2(eurPoGramuCisto * 0.925),
    eurPoGramu750: round2(eurPoGramuCisto * 0.75),
    eurPoGramu585: round2(eurPoGramuCisto * 0.585),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

