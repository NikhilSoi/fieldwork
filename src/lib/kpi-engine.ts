import type { ScenarioTab, KPI } from './scenarios';
import type { CumulativeKPIs } from './consequences';
import { BASE_KPIS, isLowerBetter } from './consequences';

/**
 * Given base tab data and cumulative KPIs from decisions,
 * produce updated tab data with modified values.
 *
 * This modifies KPI card values and chart data points
 * to reflect the consequences of previous rounds.
 */
export function applyDeltasToTabData(
  scenario: string,
  baseTabs: Record<string, ScenarioTab>,
  currentKPIs: CumulativeKPIs,
  previousKPIs: CumulativeKPIs | null,
): Record<string, ScenarioTab> {
  const base = BASE_KPIS[scenario];
  if (!base) return baseTabs;

  const tabs = structuredClone(baseTabs);

  // --- P&L tab ---
  if (tabs.pl) {
    const revenueKey = base.mrr !== undefined ? 'mrr' : base.gmv !== undefined ? 'gmv' : 'revenue';
    const revenueDelta = base[revenueKey] ? (currentKPIs[revenueKey] - base[revenueKey]) / base[revenueKey] : 0;

    // Shift final 2 data points of the primary revenue series
    const revenueArr: number[] = tabs.pl[revenueKey] ?? tabs.pl.revenue;
    if (revenueArr && revenueArr.length >= 2 && revenueDelta !== 0) {
      const len = revenueArr.length;
      revenueArr[len - 2] = Math.round(revenueArr[len - 2] * (1 + revenueDelta * 0.5));
      revenueArr[len - 1] = Math.round(revenueArr[len - 1] * (1 + revenueDelta));
    }

    tabs.pl.kpis = updateKPICards(tabs.pl.kpis, currentKPIs, previousKPIs, base);
  }

  // --- Funnel tab ---
  if (tabs.funnel) {
    const cvrKey = base.activation !== undefined ? 'activation' : 'cvr';
    const cvrDelta = base[cvrKey] ? (currentKPIs[cvrKey] - base[cvrKey]) / base[cvrKey] : 0;

    // Shift funnel stage values proportionally
    if (tabs.funnel.vals && cvrDelta !== 0) {
      const vals: number[] = tabs.funnel.vals;
      for (let i = 2; i < vals.length; i++) {
        const factor = 1 + cvrDelta * (i / vals.length);
        vals[i] = Math.round(vals[i] * factor);
      }
    }

    tabs.funnel.kpis = updateKPICards(tabs.funnel.kpis, currentKPIs, previousKPIs, base);
  }

  // --- Cohorts tab ---
  if (tabs.cohorts) {
    const retKey = base.retention !== undefined ? 'retention'
      : base.nrr !== undefined ? 'nrr'
      : base.repeatHire !== undefined ? 'repeatHire'
      : 'openRate';
    const retDelta = base[retKey] ? (currentKPIs[retKey] - base[retKey]) / base[retKey] : 0;

    const m1Arr: (number | null)[] = tabs.cohorts.m1 ?? tabs.cohorts.buyerM1 ?? tabs.cohorts.openM1;
    if (m1Arr && retDelta !== 0) {
      for (let i = 0; i < m1Arr.length; i++) {
        if (m1Arr[i] !== null) {
          m1Arr[i] = Math.round((m1Arr[i] as number) * (1 + retDelta));
        }
      }
    }

    tabs.cohorts.kpis = updateKPICards(tabs.cohorts.kpis, currentKPIs, previousKPIs, base);
  }

  // --- Benchmarks tab ---
  if (tabs.benchmarks?.metrics) {
    const cvrKey = base.activation !== undefined ? 'activation' : 'cvr';
    const currentCVR = currentKPIs[cvrKey] ?? base[cvrKey];
    const baseCVR = base[cvrKey];

    if (currentCVR && baseCVR && currentCVR > baseCVR) {
      tabs.benchmarks.metrics = tabs.benchmarks.metrics.map((m: any) => {
        if (m.gap === 'Severe' && currentCVR > baseCVR * 1.3) {
          return { ...m, gap: 'Significant' };
        }
        return m;
      });
    }

    tabs.benchmarks.kpis = updateKPICards(tabs.benchmarks.kpis, currentKPIs, previousKPIs, base);
  }

  // --- Channels + RFM: update KPI cards only ---
  if (tabs.channels) {
    tabs.channels.kpis = updateKPICards(tabs.channels.kpis, currentKPIs, previousKPIs, base);
  }
  if (tabs.rfm) {
    tabs.rfm.kpis = updateKPICards(tabs.rfm.kpis, currentKPIs, previousKPIs, base);
  }

  return tabs;
}

/** Map of KPI card labels to KPI keys for each scenario type */
const KPI_LABEL_MAP: Record<string, string> = {
  'Blended CAC': 'cac',
  'CAC': 'cac',
  'Monthly revenue': 'revenue',
  'MRR': 'mrr',
  'Churn rate': 'churn',
  'Activation rate': 'activation',
  'NRR': 'nrr',
  'Overall CVR': 'cvr',
  'Checkout CVR': 'cvr',
  'M1 retention': 'retention',
  'Repeat purchase': 'retention',
  'GMV': 'gmv',
  'Buyer:Seller ratio': 'buyerSellerRatio',
  'Repeat hire rate': 'repeatHire',
  'Time to hire': 'timeToHire',
  'Open rate': 'openRate',
  'CTOR': 'ctor',
  'Referral participation': 'referralParticipation',
  'Retention': 'retention',
};

/**
 * Update KPI cards with new values and delta-vs-previous indicators.
 */
function updateKPICards(
  kpis: KPI[],
  currentKPIs: CumulativeKPIs,
  previousKPIs: CumulativeKPIs | null,
  baseKPIs: CumulativeKPIs,
): KPI[] {
  return kpis.map((kpi) => {
    const kpiKey = KPI_LABEL_MAP[kpi.label];
    if (!kpiKey || currentKPIs[kpiKey] === undefined) return kpi;

    const currentVal = currentKPIs[kpiKey];
    const baseVal = baseKPIs[kpiKey];
    const prevVal = previousKPIs?.[kpiKey] ?? baseVal;

    const fmtVal = formatKPIValue(kpiKey, currentVal, kpi.value);

    let delta = kpi.delta;
    if (previousKPIs && prevVal !== currentVal) {
      const prevFmt = formatKPIValue(kpiKey, prevVal, kpi.value);
      const improved = isLowerBetter(kpiKey) ? currentVal < prevVal : currentVal > prevVal;
      const arrow = improved ? '\u25B2' : '\u25BC';
      delta = `${arrow} was ${prevFmt}`;
    }

    const pctChange = baseVal ? ((currentVal - baseVal) / baseVal) * 100 : 0;
    const sentiment: 'pos' | 'neg' | 'neu' = isLowerBetter(kpiKey)
      ? pctChange < -5 ? 'pos' : pctChange > 5 ? 'neg' : 'neu'
      : pctChange > 5 ? 'pos' : pctChange < -5 ? 'neg' : 'neu';

    return { ...kpi, value: fmtVal, delta, sentiment };
  });
}

function formatKPIValue(key: string, value: number, originalFormat: string): string {
  const hasPound = originalFormat.includes('£');
  const hasPercent = originalFormat.includes('%');
  const hasX = originalFormat.includes('x');

  if (hasPound) {
    if (value >= 1000) return `£${Math.round(value).toLocaleString()}`;
    return `£${value.toFixed(value < 10 ? 1 : 0)}`;
  }
  if (hasPercent) return `${value >= 10 ? Math.round(value) : value.toFixed(1)}%`;
  if (hasX) return `${value.toFixed(1)}x`;
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value >= 10 ? value.toFixed(1) : value.toFixed(2);
}
