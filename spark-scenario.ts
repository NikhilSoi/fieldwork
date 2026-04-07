// ─────────────────────────────────────────────────────────────────────────────
// SPARK — Future of E-commerce Scenario
// Social-first beauty brand born on TikTok, now facing platform dependency risk
//
// Claude Code instructions:
// 1. Add SPARK_SCENARIO to /lib/scenarios.ts under key 'ecom'
// 2. Add SPARK_DECISIONS to /lib/decisions.ts under key 'ecom'
// 3. Update scenario selector using SCENARIOS_CONFIG at the bottom
// 4. Update discipline labels on all 5 scenarios
// 5. Rebuild and redeploy
// ─────────────────────────────────────────────────────────────────────────────

// ─── ADD TO SCENARIOS in /lib/scenarios.ts under key 'ecom' ──────────────────

export const SPARK_SCENARIO = {
  name: 'Spark',
  type: 'Future of E-commerce',
  discipline: 'Future of E-commerce',
  description: 'Social-first beauty brand, TikTok-native, 2yr old. Platform fees rising from 2% to 8%.',

  pl: {
    kpis: [
      { label: 'Annual GMV', value: '£4.2M', delta: '+34% YoY', sentiment: 'pos' },
      { label: 'Gross margin', value: '52%', delta: '-6pp vs target', sentiment: 'neg' },
      { label: 'EBITDA', value: '-£180k', delta: 'Cash negative', sentiment: 'neg' },
      { label: 'Blended CAC', value: '£18', delta: '+£7 vs prior year', sentiment: 'neg' },
      { label: 'Platform fee cost', value: '£262k', delta: '8% of GMV (was 2%)', sentiment: 'neg' },
    ],
    months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    revenue:   [28, 32, 38, 44, 51, 58, 71, 89, 62],
    cogs:      [13, 15, 18, 21, 25, 28, 35, 44, 30],
    marketing: [9,  11, 14, 16, 19, 22, 27, 31, 24],
    ops:       [4,   5,  5,  6,  7,  8,  9, 11,  8],
    dataSummary: 'Annual GMV £4.2M (+34% YoY). Gross margin 52% (-6pp vs 58% target). EBITDA -£180k — cash negative despite strong revenue growth. Blended CAC £18 (up from £11 prior year). Platform fees increased from 2% to 8% of GMV — adding £262k in annualised cost. Marketing spend has grown from £9k to £24k/month in 9 months as TikTok organic reach declines and paid promotion becomes necessary to maintain visibility.',
  },

  funnel: {
    kpis: [
      { label: 'TikTok views', value: '18.4M', delta: '+22% MoM', sentiment: 'pos' },
      { label: 'TikTok Shop CVR', value: '3.1%', delta: 'Benchmark: 2.8%', sentiment: 'pos' },
      { label: 'DTC website CVR', value: '0.4%', delta: 'Benchmark: 2.2%', sentiment: 'neg' },
      { label: 'Email capture rate', value: '6.2%', delta: 'Benchmark: 14%', sentiment: 'neg' },
      { label: 'Repeat purchase', value: '19%', delta: 'Benchmark: 38%', sentiment: 'neg' },
    ],
    stages: [
      { label: 'TikTok views',       value: 18400000 },
      { label: 'Profile clicks',     value: 920000   },
      { label: 'TikTok Shop visits', value: 368000   },
      { label: 'Add to basket',      value: 88320    },
      { label: 'TikTok purchase',    value: 11418    },
      { label: 'DTC website visit',  value: 184000   },
      { label: 'DTC purchase',       value: 736      },
    ],
    bySource: [
      { channel: 'TikTok Shop', sessions: 368000, cvr: '3.1%', aov: '£28', roas: '4.2x' },
      { channel: 'DTC website', sessions: 184000, cvr: '0.4%', aov: '£41', roas: '1.1x' },
      { channel: 'Instagram',   sessions: 42000,  cvr: '0.8%', aov: '£36', roas: '1.4x' },
      { channel: 'Email',       sessions: 18000,  cvr: '2.1%', aov: '£44', roas: '—'    },
    ],
    dataSummary: '18.4M TikTok views (+22% MoM). TikTok Shop CVR 3.1% — above the 2.8% platform benchmark, strongest converting channel. DTC website CVR 0.4% vs 2.2% benchmark — a 5x gap. Email capture rate 6.2% vs 14% benchmark — the brand is not converting its social audience into owned contacts. Repeat purchase rate 19% vs 38% benchmark. DTC AOV £41 vs TikTok AOV £28 — customers who reach the DTC site spend 46% more per order.',
  },

  channels: {
    kpis: [
      { label: 'Total channel spend',    value: '£288k',   delta: '6.9% of GMV',       sentiment: 'neu' },
      { label: 'TikTok Shop revenue',    value: '£3.28M',  delta: '78% of GMV',        sentiment: 'neg' },
      { label: 'DTC website revenue',    value: '£594k',   delta: '14% of GMV',        sentiment: 'pos' },
      { label: 'Platform fee total',     value: '£262k',   delta: 'Rising 4x YoY',     sentiment: 'neg' },
      { label: 'Owned channel share',    value: '18%',     delta: 'Target: 40%',       sentiment: 'neg' },
    ],
    channels: [
      { name: 'TikTok Shop (organic)',   spend: 0,      revenue: 2100000, roas: '—',    cac: '£0',   signal: 'pos' },
      { name: 'TikTok Shop (paid promo)',spend: 168000, revenue: 1180000, roas: '7.0x', cac: '£14',  signal: 'pos' },
      { name: 'DTC website (paid)',      spend: 84000,  revenue: 594000,  roas: '1.1x', cac: '£114', signal: 'neg' },
      { name: 'Instagram Shopping',      spend: 24000,  revenue: 218000,  roas: '1.4x', cac: '£57',  signal: 'neu' },
      { name: 'Email / CRM',            spend: 12000,  revenue: 108000,  roas: '—',    cac: '£0',   signal: 'pos' },
    ],
    dataSummary: '78% of GMV through TikTok Shop — organic TikTok drives £2.1M at zero direct cost, TikTok paid promotion drives £1.18M at 7.0x ROAS. DTC website only 14% of GMV, ROAS 1.1x — barely breaking even on paid traffic to owned site. Platform fee total £262k on TikTok GMV. Email generates £108k at near-zero marginal cost but the channel is underdeveloped (only 18k subscribers). DTC CAC £114 vs TikTok CAC £14 — owned channel is 8x more expensive to drive traffic to.',
  },

  cohorts: {
    kpis: [
      { label: 'M1 retention',           value: '41%',  delta: 'Benchmark: 55%', sentiment: 'neg' },
      { label: 'M3 retention',           value: '19%',  delta: 'Benchmark: 38%', sentiment: 'neg' },
      { label: 'TikTok buyer repeat',    value: '14%',  delta: 'Platform avg: 22%', sentiment: 'neg' },
      { label: 'DTC buyer repeat',       value: '38%',  delta: 'At benchmark',   sentiment: 'pos' },
      { label: 'Email subscriber LTV',   value: '£94',  delta: 'vs £28 avg',    sentiment: 'pos' },
    ],
    cohortMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    m1: [44, 42, 41, 39, 38, 40, 43, 41],
    m2: [28, 27, 26, 24, 23, 25, 28, null],
    m3: [22, 20, 19, 18, 17, 19, null, null],
    m4: [17, 16, 14, 13, 12, null, null, null],
    m5: [13, 12, 10,  9, null, null, null, null],
    m6: [10,  9, null, null, null, null, null, null],
    dataSummary: 'M1 retention 41% (benchmark 55%), M3 19% (benchmark 38%). TikTok buyers repeat at only 14% — below the 22% TikTok platform average. DTC buyers repeat at 38% — at benchmark, 2.7x higher than TikTok buyers. Email subscribers have LTV of £94 vs £28 average customer LTV — 3.4x higher. Cohort curves declining from May onwards, suggesting TikTok audience quality is deteriorating as the brand scales paid promotion to less-targeted viewers.',
  },

  rfm: {
    kpis: [
      { label: 'Total customers',   value: '148k',  delta: '2 years trading',      sentiment: 'neu' },
      { label: 'DTC registered',    value: '9,200', delta: '6.2% of base',         sentiment: 'neg' },
      { label: 'Email subscribers', value: '18k',   delta: '12% of base',          sentiment: 'neg' },
      { label: 'High-LTV segment',  value: '4,100', delta: 'AOV £94, repeat 38%',  sentiment: 'pos' },
      { label: 'Platform-only',     value: '121k',  delta: 'No email, no DTC',     sentiment: 'neg' },
    ],
    segments: [
      { name: 'Owned Champions',    count: 4100,   revenue: '£385k', aov: '£94', action: 'Loyalty programme, referral, subscription' },
      { name: 'DTC Converts',       count: 5100,   revenue: '£204k', aov: '£40', action: 'Cross-sell, bundle, subscription nudge' },
      { name: 'Email Engaged',      count: 8800,   revenue: '£141k', aov: '£32', action: '2nd purchase incentive, DTC migration' },
      { name: 'Platform Loyalists', count: 18200,  revenue: '£509k', aov: '£28', action: 'Email capture, DTC first-order offer' },
      { name: 'One-and-Done',       count: 102900, revenue: '£2.06M',aov: '£20', action: 'Win-back or suppress — low ROI' },
      { name: 'Lapsed TikTok',      count: 9900,   revenue: '£0',    aov: '£0',  action: 'Retarget on platform or suppress' },
    ],
    dataSummary: '148k total customers. 121k are platform-only buyers — no email address, no DTC account, invisible to owned CRM. Only 18k email subscribers (12% of base) but these generate LTV of £94 — 3.4x the average. Owned Champions (4,100) generate £385k revenue at £94 AOV with 38% repeat rate. Platform Loyalists (18,200) are frequent TikTok buyers not yet on email — highest priority for owned channel migration. One-and-Done (102,900) generate £2.06M revenue but at £20 AOV with near-zero repeat rate.',
  },

  benchmarks: {
    kpis: [
      { label: 'Platform dependency', value: '78% / 45%', delta: 'High risk vs category', sentiment: 'neg' },
      { label: 'Owned channel share', value: '18% / 42%', delta: '-24pp gap',             sentiment: 'neg' },
      { label: 'Email / customers',   value: '12% / 28%', delta: 'Underleveraged',        sentiment: 'neg' },
      { label: 'DTC repeat purchase', value: '38% / 38%', delta: 'At benchmark',          sentiment: 'pos' },
      { label: 'DTC AOV',             value: '£41 / £38', delta: 'Above average',         sentiment: 'pos' },
    ],
    metrics: [
      { metric: 'Platform revenue dependency',  company: '78%',  category: '45%',  top: '28%',  gap: 'Severe' },
      { metric: 'Owned channel revenue share',  company: '18%',  category: '42%',  top: '61%',  gap: 'Severe' },
      { metric: 'Email list as % of customers', company: '12%',  category: '28%',  top: '44%',  gap: 'Significant' },
      { metric: 'DTC website CVR',              company: '0.4%', category: '2.2%', top: '3.8%', gap: 'Significant' },
      { metric: 'Customer repeat rate',         company: '19%',  category: '38%',  top: '54%',  gap: 'Significant' },
      { metric: 'Platform fee as % of GMV',     company: '8%',   category: '4%',   top: '2%',   gap: 'Above average' },
      { metric: 'DTC repeat purchase rate',     company: '38%',  category: '38%',  top: '54%',  gap: 'At benchmark' },
      { metric: 'DTC average order value',      company: '£41',  category: '£38',  top: '£62',  gap: 'Above average' },
    ],
    dataSummary: 'Platform dependency 78% vs 45% category average (Severe). Owned channel share 18% vs 42% (Severe). Email penetration 12% vs 28% (Significant). DTC CVR 0.4% vs 2.2% (Significant). Platform fee 8% of GMV vs 4% category average. DTC repeat purchase rate 38% — at benchmark, showing that customers who reach the DTC site are retained well. DTC AOV £41 vs £38 — above benchmark. Strong product-market fit but dangerous platform dependency and weak owned channel infrastructure.',
  },
};

// ─── ADD TO DECISIONS in /lib/decisions.ts under key 'ecom' ──────────────────

export const SPARK_DECISIONS = {
  budget: {
    brief: '£180k to allocate. Spark: 78% of GMV on TikTok, platform fees just rose from 2% to 8%. DTC website converts at 0.4% vs 2.2% benchmark. Owned email list only 12% of customer base. The business needs to reduce platform dependency — but how fast, and at what cost?',
    questions: [
      {
        question: 'Where should the majority of the £180k go?',
        options: [
          {
            label: 'Double down on TikTok — scale paid promotion and live commerce',
            consequence: {
              title: 'Platform revenue scales — dependency deepens',
              description: 'GMV grows 28% as TikTok paid promotion and live commerce drives volume. But platform fee cost increases to £340k annually. Owned channel share drops to 12%. The business is more profitable short-term but more exposed to future fee changes or algorithm shifts.',
              kpiDeltas: { revenue: '+28%', cac: '+18%', cvr: '+5%', retention: '-8%' },
            },
          },
          {
            label: 'Invest in DTC website — UX, checkout, and paid traffic',
            consequence: {
              title: 'Owned channel starts to build — slow but structural',
              description: 'DTC CVR improves from 0.4% to 1.1% after UX and checkout overhaul. DTC revenue share rises to 22%. Platform dependency reduces. CAC on DTC remains high at £68 — the owned channel is growing but not yet efficient.',
              kpiDeltas: { revenue: '+8%', cac: '-12%', cvr: '+175%', retention: '+18%' },
            },
          },
          {
            label: 'Build owned channels — email list growth and CRM infrastructure',
            consequence: {
              title: 'Owned audience compounds — revenue lags short-term',
              description: 'Email list grows from 18k to 41k subscribers in 6 months. Email revenue doubles. Platform dependency reduces slowly. Short-term GMV growth is modest but the owned asset being built has compounding long-term value.',
              kpiDeltas: { revenue: '+12%', cac: '-22%', cvr: '+15%', retention: '+34%' },
            },
          },
          {
            label: 'Diversify to Instagram Shopping and YouTube — reduce single-platform risk',
            consequence: {
              title: 'Portfolio approach — diluted execution across all channels',
              description: 'Instagram and YouTube channels launch but neither reaches critical scale within 6 months. Budget spread too thinly. TikTok dependency reduces marginally to 71% but no channel achieves strong ROAS. Team bandwidth is stretched.',
              kpiDeltas: { revenue: '+6%', cac: '+8%', cvr: '+4%', retention: '-4%' },
            },
          },
        ],
      },
      {
        question: 'How should you approach TikTok platform fees going forward?',
        options: [
          {
            label: 'Accept the 8% fee — TikTok ROAS still justifies the cost',
            consequence: {
              title: 'Margin pressure accepted — growth continues unchanged',
              description: 'Platform fee cost rises to £262k annually. Gross margin compresses to 47%. The business remains profitable on TikTok at scale but is increasingly exposed to further fee increases or algorithm changes.',
              kpiDeltas: { revenue: '+4%', cac: '+2%', cvr: '+3%', retention: '-2%' },
            },
          },
          {
            label: 'Negotiate volume discount — use GMV scale as leverage',
            consequence: {
              title: 'Partial fee reduction secured — 6% blended rate',
              description: 'TikTok agrees to a 6% blended rate for volume commitment. Fee cost reduces by £84k annually. Margin improves slightly. But the commitment means less flexibility to reduce TikTok spend if strategy changes.',
              kpiDeltas: { revenue: '+6%', cac: '-4%', cvr: '+2%', retention: '+2%' },
            },
          },
          {
            label: 'Reduce TikTok GMV to manage fee exposure — accept lower revenue short-term',
            consequence: {
              title: 'Fee exposure managed — revenue gap hard to fill quickly',
              description: 'TikTok GMV reduces 22% as paid promotion is scaled back. Fee cost falls to £180k. But the GMV gap is only partially offset by DTC and email growth. Net revenue declines 14% in the short term.',
              kpiDeltas: { revenue: '-14%', cac: '-18%', cvr: '+8%', retention: '+12%' },
            },
          },
          {
            label: 'Migrate top TikTok customers to DTC with exclusive first-order offers',
            consequence: {
              title: 'High-value migration succeeds — Platform Loyalists move',
              description: 'DTC first-order incentive converts 24% of Platform Loyalists to email subscribers. Owned channel share rises to 26%. Platform fee exposure reduces. DTC retention among converted customers is strong at 34%.',
              kpiDeltas: { revenue: '+3%', cac: '-14%', cvr: '+20%', retention: '+28%' },
            },
          },
        ],
      },
    ],
  },

  diagnose: {
    brief: 'Month 6: DTC website has received investment but CVR is 1.1% — still well below 2.2% benchmark. 68k unique DTC visitors last month, only 748 purchases. Email list now at 31k but open rate is 28% and CTOR is 4.2% vs 11% benchmark. Where is the owned channel strategy breaking down?',
    questions: [
      {
        question: 'Where is the biggest conversion failure in the owned channel?',
        options: [
          {
            label: 'DTC website checkout — too many steps, no social proof at point of purchase',
            consequence: {
              title: 'Checkout friction fixed — DTC CVR recovers strongly',
              description: 'One-page checkout, trust badges, and UGC reviews added at cart stage. DTC CVR improves from 1.1% to 2.0%. Monthly DTC revenue increases £28k. The fix addresses the right constraint in the funnel.',
              kpiDeltas: { revenue: '+18%', cac: '-14%', cvr: '+82%', retention: '+8%' },
            },
          },
          {
            label: 'Email content — promotional not editorial, not building purchase intent',
            consequence: {
              title: 'Email content shift — CTOR doubles but DTC CVR unchanged',
              description: 'Shift from promotional blasts to editorial content (ingredient stories, tutorials, social proof). CTOR rises from 4.2% to 9.1%. Email-driven revenue increases 48%. But DTC checkout CVR remains unchanged — email was a real problem but not the only one.',
              kpiDeltas: { revenue: '+12%', cac: '-8%', cvr: '+24%', retention: '+22%' },
            },
          },
          {
            label: 'Audience mismatch — TikTok audience is not the same persona as the DTC buyer',
            consequence: {
              title: 'Traffic quality improves — CVR recovers partially',
              description: 'Paid DTC traffic refocused on lookalikes of existing DTC buyers rather than TikTok audiences. DTC CVR rises to 1.6%. CAC on DTC reduces from £68 to £44. Correct insight but checkout friction still exists as a secondary constraint.',
              kpiDeltas: { revenue: '+9%', cac: '-18%', cvr: '+45%', retention: '+6%' },
            },
          },
          {
            label: 'Product discovery — DTC site lacks the algorithm-driven discovery TikTok provides',
            consequence: {
              title: 'Discovery UX improved — marginal CVR gain',
              description: 'Recommendation engine and quiz-based product finder added. Average pages per session increases. But CVR only improves to 1.3% — discovery was a secondary constraint, not the primary one. Checkout friction remains the bigger gap.',
              kpiDeltas: { revenue: '+5%', cac: '-4%', cvr: '+18%', retention: '+4%' },
            },
          },
        ],
      },
      {
        question: 'Why is email CTOR at 4.2% vs the 11% benchmark?',
        options: [
          {
            label: 'List quality — subscribers captured via giveaways, not genuine brand interest',
            consequence: {
              title: 'List cleaned and rebuilt — smaller but far more engaged',
              description: 'Giveaway-acquired subscribers removed. List drops from 31k to 19k but CTOR rises to 8.4%. Email revenue per subscriber increases 3.1x. A smaller, higher-quality list significantly outperforms the larger disengaged one.',
              kpiDeltas: { revenue: '+8%', cac: '-6%', cvr: '+12%', retention: '+28%' },
            },
          },
          {
            label: 'Send frequency — too many emails, subscribers are fatigued and ignoring',
            consequence: {
              title: 'Frequency reduced — open rate and engagement recover',
              description: 'Weekly send reduced to fortnightly. Unsubscribe rate falls from 0.8% to 0.2%. CTOR rises to 7.1%. Open rate improves to 38%. Reduced frequency also allows higher content quality per send.',
              kpiDeltas: { revenue: '+6%', cac: '-2%', cvr: '+8%', retention: '+16%' },
            },
          },
          {
            label: 'Content relevance — same message to all subscribers regardless of purchase history',
            consequence: {
              title: 'Segmented sends — CTOR improves most significantly',
              description: 'Three segments created: new subscribers, repeat buyers, and lapsed. Personalised content per segment. CTOR rises to 9.8%. Revenue per email send increases 2.4x. Segmentation was the highest-leverage fix available.',
              kpiDeltas: { revenue: '+14%', cac: '-10%', cvr: '+18%', retention: '+32%' },
            },
          },
          {
            label: 'Subject lines — not compelling enough to drive opens in a crowded inbox',
            consequence: {
              title: 'Open rate improves — CTOR stays flat',
              description: 'A/B testing on subject lines improves open rate from 28% to 36%. But CTOR stays at 4.4% — the content inside the email is still not compelling enough to drive clicks. Open rate was a symptom, not the root cause.',
              kpiDeltas: { revenue: '+3%', cac: '-2%', cvr: '+4%', retention: '+6%' },
            },
          },
        ],
      },
    ],
  },

  rfm: {
    brief: 'Month 9: DTC CVR improved to 1.8%, email list now at 38k with CTOR 9.2%. Owned channel is 26% of revenue. Platform fee exposure still significant at £214k annually. £90k CRM budget to deploy. Where do you invest to compound owned channel growth most efficiently?',
    questions: [
      {
        question: 'Which customer segment gets the largest CRM budget share?',
        options: [
          {
            label: 'Owned Champions — reward and retain the highest-LTV customers',
            consequence: {
              title: 'Champions retained — diminishing returns on already-loyal base',
              description: 'Exclusive loyalty programme launched. Owned Champions increase purchase frequency 12%. Net incremental revenue £31k. But Champions were already at 38% repeat — the investment yields diminishing returns on a segment already performing well.',
              kpiDeltas: { revenue: '+8%', cac: '-4%', cvr: '+6%', retention: '+14%' },
            },
          },
          {
            label: 'Platform Loyalists — migrate TikTok buyers to owned channels',
            consequence: {
              title: 'Platform-to-owned migration succeeds — structural shift',
              description: 'First-order DTC discount converts 31% of targeted Platform Loyalists to email subscribers and DTC accounts. 5,600 customers migrate. Owned channel share rises to 34%. These converted customers retain at 36% — near DTC benchmark. Highest strategic leverage.',
              kpiDeltas: { revenue: '+18%', cac: '-24%', cvr: '+22%', retention: '+38%' },
            },
          },
          {
            label: 'Email Engaged — develop mid-funnel subscribers into repeat DTC buyers',
            consequence: {
              title: 'Email-to-DTC conversion improves — solid but secondary lever',
              description: '2nd purchase incentive email sequence converts 28% of Email Engaged to repeat DTC buyers. Segment LTV increases from £32 to £54. Revenue from segment increases £48k. Good return but smaller lever than Platform Loyalist migration.',
              kpiDeltas: { revenue: '+12%', cac: '-12%', cvr: '+14%', retention: '+24%' },
            },
          },
          {
            label: 'One-and-Done — win back 102k single-purchase customers with reactivation campaign',
            consequence: {
              title: 'Large bet, thin margins — reactivation rate disappoints',
              description: 'Win-back campaign to 102k one-and-done customers achieves 4.2% reactivation — below the 8% target. Budget spread thinly across too large a segment at £20 AOV. Incremental revenue generated but margin is poor.',
              kpiDeltas: { revenue: '+6%', cac: '+14%', cvr: '+8%', retention: '-4%' },
            },
          },
        ],
      },
      {
        question: 'What is the primary mechanic for reducing platform dependency?',
        options: [
          {
            label: 'Email capture incentive on TikTok — discount code for email sign-up in-video',
            consequence: {
              title: 'Email list grows rapidly — quality is mixed',
              description: 'In-video discount code drives 14k new email sign-ups in 60 days. List reaches 52k. But 34% are discount-hunters who do not convert to full-price buyers. Net quality subscribers: 9,200. Cost per quality subscriber: £6.80.',
              kpiDeltas: { revenue: '+9%', cac: '-8%', cvr: '+10%', retention: '+12%' },
            },
          },
          {
            label: 'Subscription model — monthly replenishment subscription for hero SKU',
            consequence: {
              title: 'Subscription launches — predictable owned revenue stream',
              description: 'Monthly serum subscription at £22/mo attracts 2,100 subscribers in 90 days. £46k MRR — fully on DTC, fully off-platform. Churn at 8%/month. Subscription LTV projects to £96 — above the Owned Champions LTV of £94.',
              kpiDeltas: { revenue: '+14%', cac: '-28%', cvr: '+18%', retention: '+42%' },
            },
          },
          {
            label: 'Community platform — brand-owned community app or WhatsApp group',
            consequence: {
              title: 'Community engaged — purchase conversion weak short-term',
              description: '3,800 customers join the community platform. Engagement is high (daily active rate 34%). But community-to-purchase conversion in 90 days is 12% — below the 25% target. Community LTV is strong long-term but the 90-day ROI is low.',
              kpiDeltas: { revenue: '+4%', cac: '-6%', cvr: '+8%', retention: '+28%' },
            },
          },
          {
            label: 'Retail wholesale — stock in ASOS, Cult Beauty, or Boots to diversify channels',
            consequence: {
              title: 'Retail diversification — new channel dependency created',
              description: 'Boots trial listing drives £180k GMV in 90 days. TikTok dependency reduces from 78% to 69%. But Boots margin is 52% lower than DTC and wholesale terms add complexity. A new channel dependency has been created, not eliminated.',
              kpiDeltas: { revenue: '+11%', cac: '+6%', cvr: '+4%', retention: '-2%' },
            },
          },
        ],
      },
    ],
  },
};

// ─── UPDATED SCENARIO SELECTOR CONFIG ────────────────────────────────────────
// Replace the existing scenario list in InstructorSetup with this:

export const SCENARIOS_CONFIG = [
  {
    id: 'dtc',
    name: 'Lumé',
    discipline: 'Direct-to-Consumer',
    description: 'Premium skincare, 8mo post-launch',
  },
  {
    id: 'saas',
    name: 'Flowdesk',
    discipline: 'SaaS & Product Growth',
    description: 'B2C productivity tool, 14mo live',
  },
  {
    id: 'market',
    name: 'Stackd',
    discipline: 'Marketplace Economics',
    description: 'Freelance services marketplace, 10mo live',
  },
  {
    id: 'media',
    name: 'The Brief',
    discipline: 'Media & Monetisation',
    description: 'B2B marketing newsletter, 18mo live',
  },
  {
    id: 'ecom',
    name: 'Spark',
    discipline: 'Future of E-commerce',
    description: 'Social-first beauty brand, TikTok-native',
  },
];
