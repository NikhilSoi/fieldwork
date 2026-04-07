/**
 * Budget pot amounts and threshold for consequence mapping.
 * Round 1 (budget) and Round 3 (rfm) use slider allocation.
 * If no single option exceeds `threshold` fraction of total, fire option index `spreadThinIdx`.
 */
export type BudgetRoundConfig = {
  totalBudget: number;
  currency: string;
  threshold: number;
  spreadThinIdx: number;
};

export const BUDGET_CONFIG: Record<string, Record<string, BudgetRoundConfig>> = {
  dtc: {
    budget: { totalBudget: 80000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
    rfm:    { totalBudget: 30000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
  },
  saas: {
    budget: { totalBudget: 60000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
    rfm:    { totalBudget: 30000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
  },
  market: {
    budget: { totalBudget: 50000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
    rfm:    { totalBudget: 30000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
  },
  media: {
    budget: { totalBudget: 40000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
    rfm:    { totalBudget: 30000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
  },
  ecom: {
    budget: { totalBudget: 45000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
    rfm:    { totalBudget: 30000, currency: '£', threshold: 0.35, spreadThinIdx: 2 },
  },
};
