/**
 * Hardcoded "biggest issue" banner per scenario per round.
 * Displayed as a coloured banner above KPI cards on the P&L tab.
 */
export const PRIMARY_SIGNALS: Record<string, Record<string, { metric: string; value: string; why: string }>> = {
  dtc: {
    budget: { metric: 'LTV:CAC', value: '2.8x', why: 'below the 3x minimum needed to justify acquisition spend' },
    diagnose: { metric: 'Checkout CVR', value: '23%', why: 'benchmark is 65% — 3x gap destroying conversion economics' },
    rfm: { metric: 'At-Risk segment', value: '714 customers (17%)', why: 'were high-value buyers, now going quiet — £22k revenue at risk' },
  },
  saas: {
    budget: { metric: 'Churn rate', value: '6.2%', why: 'target is <3% — losing £11k MRR monthly, NRR below 100%' },
    diagnose: { metric: 'Activation rate', value: '31%', why: 'benchmark is 60% — 69% of signups never reach value moment' },
    rfm: { metric: 'At-Risk accounts', value: '22% of base', why: 'expansion revenue from these accounts is zero — contraction accelerating' },
  },
  market: {
    budget: { metric: 'Buyer:Seller ratio', value: '0.28', why: 'healthy ratio is 0.6+ — demand side is starved' },
    diagnose: { metric: 'Time to hire', value: '8.4 days', why: 'benchmark is 3 days — buyers churning before first match' },
    rfm: { metric: 'Repeat hire rate', value: '22%', why: 'benchmark is 45% — most buyers never come back after first project' },
  },
  media: {
    budget: { metric: 'CTOR', value: '7%', why: 'benchmark is 15% — subscribers open but don\'t click, limiting sponsor value' },
    diagnose: { metric: 'Open rate decay', value: '44% → trending down', why: 'list growth diluting engagement — sponsor CPMs at risk' },
    rfm: { metric: 'Referral participation', value: '8%', why: 'benchmark is 18% — organic growth engine stalled' },
  },
  ecom: {
    budget: { metric: 'CAC', value: '£18', why: 'AOV is £22 — losing money on first purchase with no repeat guarantee' },
    diagnose: { metric: 'CVR', value: '0.4%', why: 'benchmark is 1.8% — TikTok traffic is low-intent, funnel not optimised for it' },
    rfm: { metric: 'Retention', value: '19%', why: 'trend-driven buyers don\'t repurchase — LTV model breaks without repeat' },
  },
};
