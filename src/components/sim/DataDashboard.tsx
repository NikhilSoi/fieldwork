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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

type KPI = { label: string; value: string; delta: string; sentiment: 'pos' | 'neg' | 'neu' };

const TAB_NAMES = ['P&L', 'Funnel', 'Channels', 'Cohorts', 'RFM', 'Benchmarks'] as const;
type TabName = (typeof TAB_NAMES)[number];

export const TAB_KEY_MAP: Record<TabName, string> = {
  'P&L': 'pl', Funnel: 'funnel', Channels: 'channels', Cohorts: 'cohorts', RFM: 'rfm', Benchmarks: 'benchmarks',
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
  const hasRevenue = ch.length > 0 && ch[0].revenue !== undefined;
  const hasNewUsers = ch.length > 0 && ch[0].newUsers !== undefined;
  const hasNewBuyers = ch.length > 0 && ch[0].newBuyers !== undefined;
  const hasNewSubs = ch.length > 0 && ch[0].newSubs !== undefined;
  const secondDataset = hasRevenue
    ? { label: 'Revenue', data: ch.map((c: any) => c.revenue), backgroundColor: '#1D9E75', borderRadius: 4 }
    : hasNewUsers
    ? { label: 'New Users', data: ch.map((c: any) => c.newUsers), backgroundColor: '#1D9E75', borderRadius: 4 }
    : hasNewBuyers
    ? { label: 'New Buyers', data: ch.map((c: any) => c.newBuyers), backgroundColor: '#1D9E75', borderRadius: 4 }
    : hasNewSubs
    ? { label: 'New Subs', data: ch.map((c: any) => c.newSubs), backgroundColor: '#1D9E75', borderRadius: 4 }
    : { label: 'Revenue', data: ch.map(() => 0), backgroundColor: '#1D9E75', borderRadius: 4 };
  return { type: 'bar' as const, data: { labels: ch.map((c: any) => c.name), datasets: [
    { label: 'Spend', data: ch.map((c: any) => c.spend), backgroundColor: '#D85A30', borderRadius: 4 },
    secondDataset,
  ] }, options: chartBase };
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
  const datasets = cohortSeries.filter(s => d?.[s.key]).map((s, i) => ({
    label: s.label, data: (d[s.key] as (number | null)[]).map((v: number | null) => v ?? undefined),
    borderColor: palette[i % palette.length], backgroundColor: palette[i % palette.length] + '22', tension: 0.3, fill: false, pointRadius: 3, spanGaps: false,
  }));
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

const BUILDERS: Record<TabName, (d: any) => any> = {
  'P&L': buildPLChart, Funnel: buildFunnelChart, Channels: buildChannelsChart, Cohorts: buildCohortsChart, RFM: buildRFMChart, Benchmarks: buildBenchmarksChart,
};

interface Props { scenario: string; round: string; tabData?: any; onTabChange?: (tabKey: string) => void; }

export default function DataDashboard({ tabData, onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('P&L');
  const tabKey = TAB_KEY_MAP[activeTab];
  const td = tabData?.[activeTab] ?? tabData?.[tabKey] ?? {};
  const kpis: KPI[] = td?.kpis ?? [];
  const cfg = BUILDERS[activeTab](td);
  const Chart = cfg.type === 'line' ? Line : Bar;

  const switchTab = (t: TabName) => { setActiveTab(t); onTabChange?.(TAB_KEY_MAP[t]); };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-1 bg-white border-b border-[#D1D9D4] pb-0 overflow-x-auto rounded-t-lg">
        {TAB_NAMES.map(t => (
          <button key={t} onClick={() => switchTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t ? 'text-[#3A9E82] border-b-2 border-[#3A9E82]' : 'text-[#718096] hover:text-[#0B1F35]'}`}>{t}</button>
        ))}
      </div>

      {kpis.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {kpis.map((k, i) => (
            <div key={i} className={`rounded-lg border border-[#D1D9D4] border-l-4 p-3 bg-white ${SC[k.sentiment]} ${SB[k.sentiment]}`}>
              <div className="text-xs text-[#718096] mb-1 truncate">{k.label}</div>
              <div className="text-lg font-semibold text-[#0B1F35]">{k.value}</div>
              <div className="text-xs mt-1">{k.delta}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#D1D9D4] p-4" style={{ height: 360 }}>
        <Chart data={cfg.data} options={cfg.options} />
      </div>

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

      {activeTab === 'Channels' && td?.channels && (() => {
        const c0 = td.channels[0] ?? {};
        const cols = c0.revenue !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'revenue', label: 'Revenue', pound: true }, { key: 'roas', label: 'ROAS' }, { key: 'cac', label: 'CAC' }]
          : c0.newUsers !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newUsers', label: 'New Users' }, { key: 'cac', label: 'CAC' }, { key: 'roas', label: 'ROAS' }]
          : c0.newBuyers !== undefined
          ? [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newBuyers', label: 'New Buyers' }, { key: 'cac', label: 'CAC' }, { key: 'hireRate', label: 'Hire Rate' }]
          : [{ key: 'name', label: 'Channel' }, { key: 'spend', label: 'Spend', pound: true }, { key: 'newSubs', label: 'New Subs' }, { key: 'cps', label: 'CPS' }, { key: 'openRate', label: 'Open Rate' }];
        return (
          <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
            <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]">{cols.map(c => <th key={c.key} className="py-2 px-4 text-[#4A5568] font-medium">{c.label}</th>)}</tr></thead>
            <tbody>{td.channels.map((c: any, i: number) => (
              <tr key={i} className="border-b border-[#EEF2EF]">{cols.map((col, ci) => <td key={col.key} className={`py-2 px-4 ${ci === 0 ? 'text-[#0B1F35] font-medium' : 'text-[#4A5568]'}`}>{col.pound && typeof c[col.key] === 'number' ? `\u00a3${c[col.key]?.toLocaleString()}` : typeof c[col.key] === 'number' ? c[col.key]?.toLocaleString() : c[col.key]}</td>)}</tr>
            ))}</tbody>
          </table>
        );
      })()}

      {activeTab === 'RFM' && td?.segments && (() => {
        const s0 = td.segments[0] ?? {};
        const cols = s0.revenue !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'revenue', label: 'Revenue' }, { key: 'aov', label: 'AOV' }, { key: 'action', label: 'Action', small: true }]
          : s0.mrrShare !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'mrrShare', label: 'MRR Share' }, { key: 'avgPlan', label: 'Avg Plan' }, { key: 'action', label: 'Action', small: true }]
          : s0.gmvShare !== undefined
          ? [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'gmvShare', label: 'GMV Share' }, { key: 'avgMonthlyGMV', label: 'Avg GMV/mo' }, { key: 'action', label: 'Action', small: true }]
          : [{ key: 'name', label: 'Segment' }, { key: 'count', label: 'Count', fmt: true }, { key: 'openRate', label: 'Open Rate' }, { key: 'clickShare', label: 'Click Share' }, { key: 'action', label: 'Action', small: true }];
        return (
          <table className="w-full text-sm text-left bg-white rounded-lg border border-[#D1D9D4] overflow-hidden">
            <thead><tr className="border-b border-[#D1D9D4] bg-[#EEF2EF]">{cols.map(c => <th key={c.key} className="py-2 px-4 text-[#4A5568] font-medium">{c.label}</th>)}</tr></thead>
            <tbody>{td.segments.map((s: any, i: number) => (
              <tr key={i} className="border-b border-[#EEF2EF]">{cols.map((col, ci) => <td key={col.key} className={`py-2 px-4 ${ci === 0 ? 'text-[#0B1F35] font-medium' : col.small ? 'text-[#718096] text-xs' : 'text-[#4A5568]'}`}>{col.fmt ? s[col.key]?.toLocaleString() : s[col.key]}</td>)}</tr>
            ))}</tbody>
          </table>
        );
      })()}

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
