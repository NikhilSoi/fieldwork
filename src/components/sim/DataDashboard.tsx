'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import DecisionsSoFarTab from './DecisionsSoFarTab';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

type KPI = { label: string; value: string; delta: string; sentiment: 'pos' | 'neg' | 'neu' };

/* ── Tab order: P&L → Benchmarks → Funnel → Channels → Cohorts → RFM ── */
const TAB_NAMES_BASE = ['P&L', 'Benchmarks', 'Funnel', 'Channels', 'Cohorts', 'RFM'] as const;
type TabName = (typeof TAB_NAMES_BASE)[number] | 'Decisions';

export const TAB_KEY_MAP: Record<string, string> = {
  'P&L': 'pl', Benchmarks: 'benchmarks', Funnel: 'funnel',
  Channels: 'channels', Cohorts: 'cohorts', RFM: 'rfm', Decisions: 'decisions',
};

const SC: Record<string, string> = {
  pos: 'border-l-[#3A9E82] text-[#3A9E82]',
  neg: 'border-l-[#E53E3E] text-[#E53E3E]',
  neu: 'border-l-[#A8B8B0] text-[#718096]',
};
const SB: Record<string, string> = {
  pos: 'bg-[#E8F5F1]',
  neg: 'bg-[#E53E3E]/5',
  neu: 'bg-[#EEF2EF]',
};

const chartBase = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#4A5568', font: { size: 11 } } },
    tooltip: { backgroundColor: '#0B1F35', titleColor: '#F4F7F5', bodyColor: '#D1D9D4' },
  },
  scales: {
    x: { ticks: { color: '#4A5568' }, grid: { color: '#EEF2EF' } },
    y: { ticks: { color: '#4A5568' }, grid: { color: '#EEF2EF' } },
  },
};

/* ── RFM segment definitions ── */
const RFM_DEFINITIONS: Record<string, string> = {
  'Champions': 'bought recently, buy often, highest spend',
  'Loyal': 'buy regularly, strong LTV',
  'At-Risk': 'bought 2-4 times, gone quiet for 60+ days',
  'Promising': 'recent first purchase, low frequency',
  'New': 'single purchase only',
  'Hibernating': 'no purchase in 120+ days',
  'Power Users': 'daily active, expanding seats, highest MRR',
  'Engaged': 'regular usage, stable plan',
  'Fading': 'usage declining, no expansion',
  'Trial Converts': 'recently converted, low feature adoption',
  'New Signups': 'joined in last 30 days',
  'Dormant': 'no login in 60+ days',
};

function buildPLChart(d: any) {
  const months = d?.months ?? [];
  let sets;
  if (d?.mrr) {
    sets = [
      { key: 'mrr', label: 'MRR', color: '#378ADD' },
      { key: 'newMrr', label: 'New MRR', color: '#1D9E75' },
      { key: 'churnedMrr', label: 'Churned MRR', color: '#D85A30' },
      { key: 'expenses', label: 'Expenses', color: '#7F77DD' },
    ];
  } else if (d?.gmv) {
    sets = [
      { key: 'gmv', label: 'GMV', color: '#378ADD' },
      { key: 'netRevenue', label: 'Net Revenue', color: '#1D9E75' },
      { key: 'opex', label: 'OpEx', color: '#D85A30' },
    ];
  } else if (d?.subscribers) {
    sets = [
      { key: 'revenue', label: 'Revenue', color: '#378ADD' },
      { key: 'sponsorRevenue', label: 'Sponsor Revenue', color: '#1D9E75' },
      { key: 'otherRevenue', label: 'Other Revenue', color: '#7F77DD' },
    ];
  } else {
    sets = [
      { key: 'revenue', label: 'Revenue', color: '#378ADD' },
      { key: 'cogs', label: 'COGS', color: '#D85A30' },
      { key: 'marketing', label: 'Marketing', color: '#7F77DD' },
      { key: 'ops', label: 'Operations', color: '#1D9E75' },
    ];
  }
  return { type: 'line' as const, data: { labels: months, datasets: sets.map(s => ({ label: s.label, data: d?.[s.key] ?? [], borderColor: s.color, backgroundColor: s.color + '22', tension: 0.3, fill: false, pointRadius: 3 })) }, options: chartBase };
}

function buildFunnelChart(d: any) {
  const raw = d?.stages ?? [];
  const isObjects = raw.length > 0 && typeof raw[0] === 'object';
  const labels = isObjects ? raw.map((s: any) => s.label) : raw;
  const vals = isObjects ? raw.map((s: any) => s.value) : (d?.vals ?? []);
  return { type: 'bar' as const, data: { labels, datasets: [{ label: 'Volume', data: vals, backgroundColor: '#378ADD', borderRadius: 4 }] }, options: { ...chartBase, indexAxis: 'y' as const } };
}

function buildChannelsChart(d: any) {
  const ch = d?.channels ?? [];
  const revenueKey = ch[0]?.revenue !== undefined ? 'revenue'
    : ch[0]?.newUsers !== undefined ? 'newUsers'
    : ch[0]?.newBuyers !== undefined ? 'newBuyers'
    : ch[0]?.newSubs !== undefined ? 'newSubs'
    : 'revenue';
  const revenueLabel = revenueKey === 'newUsers' ? 'New Users'
    : revenueKey === 'newBuyers' ? 'New Buyers'
    : revenueKey === 'newSubs' ? 'New Subs'
    : 'Revenue';

  return {
    type: 'bar' as const,
    data: {
      labels: ch.map((c: any) => c.name),
      datasets: [
        { label: 'Budget Allocated', data: ch.map((c: any) => c.spend), backgroundColor: '#D85A30', borderRadius: 4 },
        { label: revenueLabel, data: ch.map((c: any) => c[revenueKey] ?? 0), backgroundColor: '#1D9E75', borderRadius: 4 },
      ],
    },
    options: { ...chartBase, indexAxis: 'y' as const },
  };
}

function buildCohortsChart(d: any) {
  const months = d?.cohortMonths ?? [];
  const palette = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#E6A817', '#888'];
  const hasBuyerSeller = d?.buyerM1 !== undefined;
  const hasOpen = d?.openM1 !== undefined;
  let cohortSeries: { key: string; label: string }[];
  if (hasBuyerSeller) {
    cohortSeries = [
      { key: 'buyerM1', label: 'Buyer M1' }, { key: 'buyerM2', label: 'Buyer M2' }, { key: 'buyerM3', label: 'Buyer M3' },
      { key: 'sellerM1', label: 'Seller M1' }, { key: 'sellerM3', label: 'Seller M3' }, { key: 'sellerM6', label: 'Seller M6' },
    ];
  } else if (hasOpen) {
    cohortSeries = [
      { key: 'openM1', label: 'Open M1' }, { key: 'openM3', label: 'Open M3' }, { key: 'openM6', label: 'Open M6' },
      { key: 'openM9', label: 'Open M9' }, { key: 'openM12', label: 'Open M12' },
    ];
  } else {
    cohortSeries = [
      { key: 'm1', label: 'M1' }, { key: 'm2', label: 'M2' }, { key: 'm3', label: 'M3' },
      { key: 'm4', label: 'M4' }, { key: 'm5', label: 'M5' }, { key: 'm6', label: 'M6' },
    ];
  }
  const datasets: any[] = cohortSeries.filter(s => d?.[s.key]).map((s, i) => ({
    label: s.label, data: (d[s.key] as (number | null)[]).map((v: number | null) => v ?? undefined),
    borderColor: palette[i % palette.length], backgroundColor: palette[i % palette.length] + '22', tension: 0.3, fill: false, pointRadius: 3, spanGaps: false,
  }));

  /* Dotted benchmark line from M1 KPI card */
  const benchmarkKPI = (d?.kpis ?? []).find((k: any) => k.delta?.includes('Benchmark'));
  const benchmarkMatch = benchmarkKPI?.delta?.match(/(\d+)/);
  const benchmarkVal = benchmarkMatch ? parseInt(benchmarkMatch[1]) : null;
  if (benchmarkVal) {
    datasets.push({
      label: 'M1 Benchmark',
      data: months.map(() => benchmarkVal),
      borderColor: '#718096',
      borderDash: [6, 4],
      backgroundColor: 'transparent',
      tension: 0,
      fill: false,
      pointRadius: 0,
      borderWidth: 2,
    });
  }

  return { type: 'line' as const, data: { labels: months, datasets }, options: chartBase };
}

function buildRFMChart(d: any) {
  const seg = d?.segments ?? [];
  const palette = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#E6A817', '#888'];
  return { type: 'bar' as const, data: { labels: seg.map((s: any) => s.name), datasets: [{ label: 'Count', data: seg.map((s: any) => s.count), backgroundColor: seg.map((_: any, i: number) => palette[i % palette.length]), borderRadius: 4 }] }, options: { ...chartBase, indexAxis: 'y' as const } };
}

function parseNum(v: string): number { return parseFloat(String(v).replace(/[%x£,]/g, '').trim()) || 0; }

function buildBenchmarksChart(d: any) {
  const m = d?.metrics ?? [];
  return { type: 'bar' as const, data: { labels: m.map((x: any) => x.metric), datasets: [
    { label: 'Company', data: m.map((x: any) => parseNum(x.company)), backgroundColor: '#378ADD', borderRadius: 4 },
    { label: 'Category', data: m.map((x: any) => parseNum(x.category)), backgroundColor: '#7F77DD', borderRadius: 4 },
    { label: 'Top Quartile', data: m.map((x: any) => parseNum(x.top)), backgroundColor: '#1D9E75', borderRadius: 4 },
  ] }, options: chartBase };
}

type ChartTabName = Exclude<TabName, 'Decisions'>;
const BUILDERS: Record<ChartTabName, (d: any) => any> = {
  'P&L': buildPLChart, Funnel: buildFunnelChart, Channels: buildChannelsChart, Cohorts: buildCohortsChart, RFM: buildRFMChart, Benchmarks: buildBenchmarksChart,
};

interface Props {
  scenario: string;
  round: string;
  roundIdx: number;
  tabData?: any;
  onTabChange?: (tabKey: string) => void;
  pastDecisions?: any[];
  primarySignal?: { metric: string; value: string; why: string } | null;
}

export default function DataDashboard({ scenario, roundIdx, tabData, onTabChange, pastDecisions, primarySignal }: Props) {
  const showDecisionsTab = roundIdx >= 1 && pastDecisions && pastDecisions.length > 0;
  const TAB_NAMES: TabName[] = showDecisionsTab
    ? [...TAB_NAMES_BASE, 'Decisions']
    : [...TAB_NAMES_BASE];

  const [activeTab, setActiveTab] = useState<TabName>('P&L');
  const tabKey = TAB_KEY_MAP[activeTab] ?? 'pl';
  const td = tabData?.[activeTab] ?? tabData?.[tabKey] ?? {};
  const kpis: KPI[] = td?.kpis ?? [];

  const switchTab = (t: TabName) => { setActiveTab(t); onTabChange?.(TAB_KEY_MAP[t] ?? 'pl'); };

  /* ── Decisions tab ── */
  if (activeTab === 'Decisions') {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-1 bg-white border-b border-[#D1D9D4] pb-0 overflow-x-auto rounded-t-lg">
          {TAB_NAMES.map(t => (
            <button key={t} onClick={() => switchTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? 'text-[#3A9E82] border-b-2 border-[#3A9E82]' : 'text-[#718096] hover:text-[#0B1F35]'}`}>{t}</button>
          ))}
        </div>
        <DecisionsSoFarTab scenario={scenario} pastDecisions={pastDecisions ?? []} />
      </div>
    );
  }

  /* ── Chart tabs ── */
  const cfg = BUILDERS[activeTab as ChartTabName]?.(td);
  const Chart = cfg?.type === 'line' ? Line : Bar;

  /* Filter EBITDA from P&L KPI cards */
  const displayKpis = activeTab === 'P&L'
    ? kpis.filter(k => !k.label.toLowerCase().includes('ebitda'))
    : kpis;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-1 bg-white border-b border-[#D1D9D4] pb-0 overflow-x-auto rounded-t-lg">
        {TAB_NAMES.map(t => (
          <button key={t} onClick={() => switchTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? 'text-[#3A9E82] border-b-2 border-[#3A9E82]' : 'text-[#718096] hover:text-[#0B1F35]'}`}>{t}</button>
        ))}
      </div>

      {/* Primary signal banner — P&L tab only */}
      {activeTab === 'P&L' && primarySignal && (
        <div className="rounded-lg bg-[#FFF8E1] border border-[#F59E0B]/30 px-4 py-3">
          <p className="text-sm font-semibold text-[#92400E]">
            Biggest issue: {primarySignal.metric} is {primarySignal.value} — {primarySignal.why}
          </p>
        </div>
      )}

      {displayKpis.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {displayKpis.map((k, i) => (
            <div key={i} className={`rounded-lg border border-[#D1D9D4] border-l-4 p-3 bg-white ${SC[k.sentiment]} ${SB[k.sentiment]}`}>
              <div className="text-xs text-[#718096] mb-1 truncate">{k.label}</div>
              <div className="text-lg font-semibold text-[#0B1F35]">{k.value}</div>
              <div className="text-xs mt-1">{k.delta}</div>
            </div>
          ))}
        </div>
      )}

      {cfg && (
        <div className="bg-white rounded-lg border border-[#D1D9D4] p-4" style={{ height: 360 }}>
          <Chart data={cfg.data} options={cfg.options} />
        </div>
      )}

      {/* ── Cohorts: plain-language summary ── */}
      {activeTab === 'Cohorts' && td && (() => {
        const m1Arr: (number | null)[] = td.m1 ?? td.buyerM1 ?? td.openM1 ?? [];
        const months: string[] = td.cohortMonths ?? [];
        const validEntries = m1Arr
          .map((v: number | null, i: number) => ({ month: months[i], value: v }))
          .filter((e: any): e is { month: string; value: number } => e.value !== null);

        if (validEntries.length < 2) return null;

        const best = validEntries.reduce((a: any, b: any) => (b.value > a.value ? b : a));
        const worst = validEntries.reduce((a: any, b: any) => (b.value < a.value ? b : a));

        return (
          <div className="rounded-lg bg-[#F4F7F5] border border-[#D1D9D4] px-4 py-3">
            <p className="text-sm text-[#4A5568]">
              Your best cohort ({best.month}) retained {best.value}% at month 1.
              Your weakest ({worst.month}) retained {worst.value}%.
              {best.value - worst.value > 5 && ` Something changed in ${worst.month} — the data doesn't explain what.`}
            </p>
          </div>
        );
      })()}

      {/* ── Funnel table ── */}
      {activeTab === 'Funnel' && (td?.bySource || td?.byCategory || td?.bySegment) && (() => {
        const rows = td.bySource ?? td.byCategory ?? td.bySegment ?? [];
        const r0 = rows[0] ?? {};
        const cols = r0.sessions !== undefined
          ? [{ key: 'channel', label: 'Channel' }, { key: 'sessions', label: 'Sessions', fmt: true }, { key: 'cvr', label: 'CVR' }, { key: 'aov', label: 'AOV' }, { key: 'roas', label: 'ROAS' }]
          : r0.signups !== undefined
          ? [{ key: 'channel', label: 'Channel' }, { key: 'signups', label: 'Signups', fmt: true }, { key: 'activation', label: 'Activation' }, { key: 'trialToPaid', label: 'Trial\u2192Paid' }, { key: 'ltv', label: 'LTV' }]
          : r0.category !== undefined
          ? [{ key: 'category', label: 'Category' }, { key: 'briefs', label: 'Briefs', fmt: true }, { key: 'hireRate', label: 'Hire Rate' }, { key: 'avgValue', label: 'Avg Value' }, { key: 'ttHire', label: 'Time to Hire' }]
          : [{ key: 'segment', label: 'Segment' }, { key: 'subs', label: 'Subs', fmt: true }, { key: 'openRate', label: 'Open Rate' }, { key: 'ctor', label: 'CTOR' }, { key: 'sponsorCtr', label: 'Sponsor CTR' }];
        return (
          <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
            <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]">{cols.map(c => <th key={c.key} className="py-2 px-4 text-[#4A5568] font-medium">{c.label}</th>)}</tr></thead>
            <tbody>{rows.map((r: any, i: number) => (
              <tr key={i} className="border-b border-[#EEF2EF]">{cols.map((c, ci) => <td key={c.key} className={`py-2 px-4 ${ci === 0 ? 'text-[#0B1F35] font-medium' : 'text-[#4A5568]'}`}>{c.fmt ? r[c.key]?.toLocaleString() : r[c.key]}</td>)}</tr>
            ))}</tbody>
          </table>
        );
      })()}

      {/* ── Channels table with cost per £1 ── */}
      {activeTab === 'Channels' && td?.channels && (() => {
        const ch = td.channels;
        const hasRevenue = ch[0]?.revenue !== undefined;
        const c0 = ch[0] ?? {};
        const baseCols = c0.revenue !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'revenue', label: 'Revenue', pound: true }, { key: 'roas', label: 'ROAS' }, { key: 'cac', label: 'CAC' }]
          : c0.newUsers !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newUsers', label: 'New Users' }, { key: 'cac', label: 'CAC' }, { key: 'roas', label: 'ROAS' }]
          : c0.newBuyers !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newBuyers', label: 'New Buyers' }, { key: 'cac', label: 'CAC' }, { key: 'hireRate', label: 'Hire Rate' }]
          : [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newSubs', label: 'New Subs' }, { key: 'cps', label: 'CPS' }, { key: 'openRate', label: 'Open Rate' }];
        const cols: any[] = hasRevenue ? [...baseCols, { key: '_costPer1', label: 'Cost per £1' }] : baseCols;
        return (
          <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
            <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]">{cols.map((c: any) => <th key={c.key} className="py-2 px-4 text-[#4A5568] font-medium">{c.label}</th>)}</tr></thead>
            <tbody>{ch.map((c: any, i: number) => {
              const costPer1 = c.revenue && c.spend > 0 ? `£${(c.spend / c.revenue).toFixed(2)}` : c.spend === 0 ? '£0.00' : '—';
              const costVal = parseFloat(costPer1.replace('£', ''));
              return (
                <tr key={i} className="border-b border-[#EEF2EF]">{cols.map((col: any, ci: number) => (
                  <td key={col.key} className={`py-2 px-4 ${ci === 0 ? 'text-[#0B1F35] font-medium' : col.key === '_costPer1' ? (costVal > 0.5 ? 'text-[#E53E3E] font-medium' : 'text-[#3A9E82] font-medium') : 'text-[#4A5568]'}`}>
                    {col.key === '_costPer1' ? `${costPer1} per £1 revenue` : col.pound && typeof c[col.key] === 'number' ? `\u00a3${c[col.key]?.toLocaleString()}` : typeof c[col.key] === 'number' ? c[col.key]?.toLocaleString() : c[col.key]}
                  </td>
                ))}</tr>
              );
            })}</tbody>
          </table>
        );
      })()}

      {/* ── RFM: revenue concentration bar + segment table with definitions ── */}
      {activeTab === 'RFM' && td?.segments && (() => {
        const seg = td.segments;
        const palette = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#E6A817', '#888'];

        const parseRev = (r: string) => {
          if (!r) return 0;
          const num = parseFloat(r.replace(/[£$,k]/gi, ''));
          return r.toLowerCase().includes('k') ? num * 1000 : num;
        };

        const revKey = seg[0]?.revenue !== undefined ? 'revenue'
          : seg[0]?.mrrShare !== undefined ? 'mrrShare'
          : seg[0]?.gmvShare !== undefined ? 'gmvShare'
          : null;

        const s0 = seg[0] ?? {};
        const cols = s0.revenue !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'revenue', label: 'Revenue' }, { key: 'aov', label: 'AOV' }, { key: 'action', label: 'Action', small: true }]
          : s0.mrrShare !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'mrrShare', label: 'MRR Share' }, { key: 'avgPlan', label: 'Avg Plan' }, { key: 'action', label: 'Action', small: true }]
          : s0.gmvShare !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'gmvShare', label: 'GMV Share' }, { key: 'avgMonthlyGMV', label: 'Avg GMV/mo' }, { key: 'action', label: 'Action', small: true }]
          : [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'openRate', label: 'Open Rate' }, { key: 'clickShare', label: 'Click Share' }, { key: 'action', label: 'Action', small: true }];

        /* Revenue concentration bar */
        let revBar = null;
        if (revKey) {
          const revValues = seg.map((s: any) => parseRev(String(s[revKey])));
          const total = revValues.reduce((a: number, b: number) => a + b, 0);
          if (total > 0) {
            const pcts = revValues.map((v: number) => Math.round((v / total) * 100));
            revBar = (
              <div className="rounded-lg bg-white border border-[#D1D9D4] p-3 mb-3">
                <p className="text-xs text-[#718096] mb-2 font-medium">Revenue by segment</p>
                <div className="flex h-6 rounded-md overflow-hidden">
                  {seg.map((s: any, i: number) => (
                    pcts[i] > 0 && (
                      <div
                        key={i}
                        className="flex items-center justify-center text-white text-[10px] font-semibold"
                        style={{ width: `${pcts[i]}%`, backgroundColor: palette[i % palette.length] }}
                        title={`${s.name}: ${pcts[i]}%`}
                      >
                        {pcts[i] >= 8 && `${s.name} ${pcts[i]}%`}
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          }
        }

        return (
          <>
            {revBar}
            <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
              <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]">{cols.map(c => <th key={c.key} className="py-2 px-4 text-[#4A5568] font-medium">{c.label}</th>)}</tr></thead>
              <tbody>{seg.map((s: any, i: number) => (
                <tr key={i} className="border-b border-[#EEF2EF]">{cols.map((col, ci) => (
                  <td key={col.key} className={`py-2 px-4 ${ci === 0 ? 'text-[#0B1F35]' : col.small ? 'text-[#718096] text-xs' : 'text-[#4A5568]'}`}>
                    {ci === 0 ? (
                      <div>
                        <div className="font-medium">{s[col.key]}</div>
                        {RFM_DEFINITIONS[s[col.key]] && <div className="text-[10px] text-[#718096] mt-0.5">{RFM_DEFINITIONS[s[col.key]]}</div>}
                      </div>
                    ) : col.fmt ? s[col.key]?.toLocaleString() : s[col.key]}
                  </td>
                ))}</tr>
              ))}</tbody>
            </table>
          </>
        );
      })()}

      {/* ── Benchmarks table ── */}
      {activeTab === 'Benchmarks' && td?.metrics && (
        <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
          <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]"><th className="py-2 px-4 text-[#4A5568] font-medium">Metric</th><th className="py-2 px-4 text-[#4A5568] font-medium">Company</th><th className="py-2 px-4 text-[#4A5568] font-medium">Category</th><th className="py-2 px-4 text-[#4A5568] font-medium">Top</th><th className="py-2 px-4 text-[#4A5568] font-medium">Gap</th></tr></thead>
          <tbody>{td.metrics.map((m: any, i: number) => (
            <tr key={i} className="border-b border-[#EEF2EF]"><td className="py-2 px-4 text-[#0B1F35] font-medium">{m.metric}</td><td className="py-2 px-4 text-[#4A5568]">{m.company}</td><td className="py-2 px-4 text-[#4A5568]">{m.category}</td><td className="py-2 px-4 text-[#4A5568]">{m.top}</td><td className={`py-2 px-4 text-xs font-medium ${m.gap === 'Severe' ? 'text-[#E53E3E]' : m.gap === 'Significant' ? 'text-[#D97706]' : m.gap === 'Above avg' ? 'text-[#3A9E82]' : 'text-[#718096]'}`}>{m.gap}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
