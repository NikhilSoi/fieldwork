import { DECISIONS, type RoundKey } from './decisions';

export type CumulativeKPIs = {
  [key: string]: number;
};

export const BASE_KPIS: Record<string, CumulativeKPIs> = {
  dtc: { revenue: 68.4, cac: 42, cvr: 0.9, retention: 11 },
  saas: { mrr: 84.2, churn: 6.2, activation: 31, nrr: 88 },
  market: { gmv: 82, buyerSellerRatio: 0.28, repeatHire: 22, timeToHire: 8.4 },
  media: { revenue: 18.2, openRate: 44, ctor: 7, referralParticipation: 8 },
  ecom: { revenue: 4200, cac: 18, cvr: 0.4, retention: 19 },
};

/** KPIs where lower is better */
const LOWER_IS_BETTER = new Set(['cac', 'churn', 'cps', 'timeToHire']);

export function isLowerBetter(key: string): boolean {
  return LOWER_IS_BETTER.has(key);
}

function parseDelta(delta: string): number {
  const num = parseFloat(delta.replace('%', '').replace('+', ''));
  return isNaN(num) ? 0 : num;
}

export function applyKPIDelta(
  baseValue: number,
  delta: string
): number {
  const pct = parseDelta(delta);
  return Math.round((baseValue * (1 + pct / 100)) * 10) / 10;
}

/**
 * Compute cumulative KPIs from a team's decisions.
 * Each decision stores final_votes: { 0: optionIdx, 1: optionIdx }
 * We look up the chosen option's consequence.kpiDeltas and apply them.
 */
export function computeCumulativeKPIs(
  scenario: string,
  completedRounds: { round: RoundKey; finalVotes: Record<number, number> }[]
): CumulativeKPIs {
  const base = BASE_KPIS[scenario];
  if (!base) return {};

  const current = { ...base };
  const scenarioDecisions = DECISIONS[scenario];
  if (!scenarioDecisions) return current;

  for (const { round, finalVotes } of completedRounds) {
    const roundData = scenarioDecisions[round];
    if (!roundData) continue;

    // For each question, get the chosen option's kpiDeltas
    roundData.questions.forEach((q, qIdx) => {
      const chosenIdx = finalVotes[qIdx];
      if (chosenIdx == null) return;
      const option = q.options[chosenIdx];
      if (!option) return;

      const deltas = option.consequence.kpiDeltas;
      for (const [key, delta] of Object.entries(deltas)) {
        if (key in current) {
          current[key] = applyKPIDelta(current[key], delta);
        }
      }
    });
  }

  return current;
}

/**
 * Compute a composite improvement score for ranking teams.
 * Returns a single number — higher is better.
 * Normalises each KPI's % change, flipping sign for lower-is-better KPIs.
 */
export function computeCompositeScore(
  scenario: string,
  finalKPIs: CumulativeKPIs
): number {
  const base = BASE_KPIS[scenario];
  if (!base) return 0;

  let totalScore = 0;
  const keys = Object.keys(base);

  for (const key of keys) {
    const start = base[key];
    const end = finalKPIs[key] ?? start;
    const pctChange = ((end - start) / start) * 100;
    // For lower-is-better KPIs, flip the sign so decreases are positive
    totalScore += LOWER_IS_BETTER.has(key) ? -pctChange : pctChange;
  }

  return totalScore;
}

export function formatKPI(key: string, value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export { BASE_KPIS as default };
