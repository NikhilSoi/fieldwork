export type Consequence = {
  title: string;
  description: string;
  kpiDeltas: Record<string, string>;
};

export type Option = {
  label: string;
  consequence: Consequence;
};

export type Question = {
  question: string;
  options: Option[];
};

export type Round = {
  brief: string;
  questions: Question[];
};

export type ScenarioDecisions = {
  budget: Round;
  diagnose: Round;
  rfm: Round;
};

export const ROUND_ORDER = ['budget', 'diagnose', 'rfm'] as const;
export type RoundKey = (typeof ROUND_ORDER)[number];

export const DECISIONS: Record<string, ScenarioDecisions> = {
  dtc: {
    budget: {
      brief: '£80k to allocate. Lumé: 22k monthly sessions, CVR 0.9% vs 2.5% benchmark. Revenue needs +40% in Q3. Study the data across all tabs before your team votes.',
      questions: [
        {
          question: 'Where should the majority of budget go?',
          options: [
            {
              label: 'Paid acquisition — scale top-of-funnel',
              consequence: {
                title: 'Traffic scales, funnel does not',
                description: 'Sessions up 31% but CVR stays flat at 0.95%. CAC increases to £58. Revenue up 9% but below Q3 target. Entering Round 2 with a tighter budget and unchanged funnel constraints.',
                kpiDeltas: { revenue: '+9%', cac: '+21%', cvr: '+5%', retention: '-10%' },
              },
            },
            {
              label: 'Mid-funnel content & SEO',
              consequence: {
                title: 'Content builds slowly, no short-term impact',
                description: 'Organic sessions begin growing but take 3+ months to materialise. Q3 revenue target missed. CAC unchanged. Round 2 budget constrained with no funnel improvement yet.',
                kpiDeltas: { revenue: '+4%', cac: '+8%', cvr: '+12%', retention: '+5%' },
              },
            },
            {
              label: 'Checkout & conversion rate optimisation',
              consequence: {
                title: 'Funnel healing — CVR begins recovering',
                description: 'Checkout CVR moves from 23% towards 38% in 6 weeks. Revenue run-rate improves significantly as existing traffic converts better. CAC pressure eases. Strong position entering Round 2.',
                kpiDeltas: { revenue: '+18%', cac: '-19%', cvr: '+100%', retention: '+22%' },
              },
            },
            {
              label: 'Retention — email, loyalty, re-engagement',
              consequence: {
                title: 'Loyalty strengthens, acquisition gap widens',
                description: 'Repeat purchase rate improves among existing customers. But the funnel leak remains open and new customer acquisition continues to underperform. Revenue growth modest.',
                kpiDeltas: { revenue: '+6%', cac: '+5%', cvr: '+8%', retention: '+35%' },
              },
            },
          ],
        },
        {
          question: 'How should you split brand vs performance spend?',
          options: [
            {
              label: '90% performance / 10% brand',
              consequence: {
                title: 'Short-term squeeze — diminishing returns',
                description: 'Performance channels saturate quickly. Meta frequency hits 7.2x. ROAS declines from 1.4x to 0.9x within 4 weeks. No brand pipeline to fall back on.',
                kpiDeltas: { revenue: '+5%', cac: '+18%', cvr: '+3%', retention: '-4%' },
              },
            },
            {
              label: '70% performance / 30% brand',
              consequence: {
                title: 'Balanced — performance with brand support',
                description: 'Performance spend drives immediate revenue while brand investment builds consideration pipeline. Google branded search queries up 22%. Sustainable trajectory.',
                kpiDeltas: { revenue: '+12%', cac: '-8%', cvr: '+15%', retention: '+10%' },
              },
            },
            {
              label: '50 / 50',
              consequence: {
                title: 'Neither channel fully funded',
                description: 'Spread across both but performance budget too thin for optimisation, brand budget too thin for awareness. Moderate results across the board.',
                kpiDeltas: { revenue: '+7%', cac: '+2%', cvr: '+8%', retention: '+6%' },
              },
            },
            {
              label: '30% performance / 70% brand',
              consequence: {
                title: 'Brand builds slowly, revenue gap widens',
                description: 'Brand awareness growing but no short-term revenue impact. Aided recall up 12% but Q3 target at risk. Board concerned about cash runway.',
                kpiDeltas: { revenue: '+2%', cac: '+14%', cvr: '+4%', retention: '+8%' },
              },
            },
          ],
        },
      ],
    },
    diagnose: {
      brief: 'Month 2: 28k visitors, 4,200 add-to-carts, 1,800 checkout starts, 420 purchases. Repeat 11%. The constraint is specific — find it in the data.',
      questions: [
        {
          question: 'Where is the biggest and most actionable leak?',
          options: [
            {
              label: 'Awareness → consideration',
              consequence: {
                title: 'Top-of-funnel explored — funnel still leaking',
                description: 'More visitors enter but the same checkout bottleneck persists. Add-to-cart rate unchanged at 14.2%. Revenue improves slightly from volume. The core leak at checkout remains.',
                kpiDeltas: { revenue: '+6%', cac: '+8%', cvr: '+4%', retention: '-2%' },
              },
            },
            {
              label: 'Add-to-cart → checkout start',
              consequence: {
                title: 'Product pages improved — some progress',
                description: 'Add-to-cart rate improves from 14.2% to 18%. More users reaching checkout. But the 23% checkout completion rate is still the bigger bottleneck — most of the uplift gets lost downstream.',
                kpiDeltas: { revenue: '+10%', cac: '-4%', cvr: '+28%', retention: '+5%' },
              },
            },
            {
              label: 'Checkout start → purchase',
              consequence: {
                title: 'Core leak identified — funnel recovering',
                description: 'Checkout CVR moves from 23% towards 41% in 4 weeks. Payment failures reduced. Mobile checkout simplified. Existing traffic converting at a fundamentally higher rate.',
                kpiDeltas: { revenue: '+18%', cac: '-12%', cvr: '+60%', retention: '+15%' },
              },
            },
            {
              label: 'Post-purchase → repeat',
              consequence: {
                title: 'Repeat improving, but new customer flow still broken',
                description: 'Repeat rate improves from 11% to 16% among existing customers. But the funnel keeps haemorrhaging new buyers at checkout. Revenue growth limited to existing base.',
                kpiDeltas: { revenue: '+5%', cac: '+4%', cvr: '+3%', retention: '+32%' },
              },
            },
          ],
        },
        {
          question: 'Most likely root cause?',
          options: [
            {
              label: 'Poor targeting — wrong audience',
              consequence: {
                title: 'Audience refined but funnel unchanged',
                description: 'Tighter targeting improves quality slightly. Add-to-cart rate inches up. But the checkout bottleneck is structural, not audience-related. Checkout CVR stays at 24%.',
                kpiDeltas: { revenue: '+4%', cac: '-6%', cvr: '+10%', retention: '+2%' },
              },
            },
            {
              label: 'Weak product pages — no social proof',
              consequence: {
                title: 'Product pages enriched — moderate uplift',
                description: 'Reviews, UGC, and social proof added. Add-to-cart rate improves. Some downstream benefit but the checkout-specific friction (payment failures, mobile UX) persists.',
                kpiDeltas: { revenue: '+8%', cac: '-3%', cvr: '+22%', retention: '+8%' },
              },
            },
            {
              label: 'Cart abandonment — UX or payment friction',
              consequence: {
                title: 'Root cause nailed — checkout transforming',
                description: 'Payment failure rate 11.2% → 3.8%. Mobile checkout redesigned. Guest checkout added. The 23% → 38% completion rate unlocks the full funnel. Revenue trajectory strong.',
                kpiDeltas: { revenue: '+16%', cac: '-14%', cvr: '+55%', retention: '+12%' },
              },
            },
            {
              label: 'No retention programme',
              consequence: {
                title: 'Retention programme built — acquisition leak persists',
                description: 'Email flows and loyalty programme launched. Existing customer LTV improving. But the checkout remains broken for new customers — growth limited to repeat base.',
                kpiDeltas: { revenue: '+5%', cac: '+6%', cvr: '+2%', retention: '+28%' },
              },
            },
          ],
        },
      ],
    },
    rfm: {
      brief: '4,200 customers. RFM analysis complete. Champions (9%) drive 41% of revenue. At-Risk (17%) were high-value but going quiet. Promising (24%) bought once recently. Prior decisions affect your budget and segment health.',
      questions: [
        {
          question: 'Which segment gets the largest CRM budget share?',
          options: [
            {
              label: 'Champions — keep your best loyal',
              consequence: {
                title: 'Champions engaged — were buying anyway',
                description: 'Exclusive rewards programme launched. Champions appreciate it but incremental spend is only £8k — most was cannibalised from purchases they would have made regardless. At-Risk decay continues.',
                kpiDeltas: { revenue: '+3%', cac: '+4%', cvr: '+3%', retention: '+8%' },
              },
            },
            {
              label: 'At-Risk — win back lapsed high-value',
              consequence: {
                title: 'Win-back working — high-value reactivating',
                description: 'Win-back sequence re-engages 18% of At-Risk segment (benchmark 12%). Reactivated customer AOV: £94. +£47k incremental revenue in 90 days. Strong LTV compounding.',
                kpiDeltas: { revenue: '+22%', cac: '-8%', cvr: '+15%', retention: '+28%' },
              },
            },
            {
              label: 'Promising — develop into regulars',
              consequence: {
                title: 'Second purchase nudge — moderate conversion',
                description: '12% of Promising segment makes second purchase. AOV £64. Revenue uplift £15k. Promising is large so ceiling is high, but conversion rate limited by product familiarity.',
                kpiDeltas: { revenue: '+10%', cac: '-2%', cvr: '+8%', retention: '+18%' },
              },
            },
            {
              label: 'New — convert first-timers',
              consequence: {
                title: 'Onboarding improved — slow payoff',
                description: 'New customer welcome flow launched. First-to-second purchase rate improving but slowly — most are still within their first 30 days. Long-term healthy, short-term minimal revenue impact.',
                kpiDeltas: { revenue: '+4%', cac: '-5%', cvr: '+6%', retention: '+12%' },
              },
            },
          ],
        },
        {
          question: 'What is the primary mechanic?',
          options: [
            {
              label: 'Exclusive rewards and early access',
              consequence: {
                title: 'Loyalty programme launches — low incrementality',
                description: 'VIP programme with early access and double loyalty points. Engagement high but purchases were already happening. Incrementality estimated at 15% — rest is cannibalisation.',
                kpiDeltas: { revenue: '+4%', cac: '+2%', cvr: '+5%', retention: '+10%' },
              },
            },
            {
              label: 'Win-back sequence with time-limited offer',
              consequence: {
                title: 'Urgency drives re-engagement — At-Risk responding',
                description: 'Time-limited 20% win-back offer sent to At-Risk. Response rate 22%. Reactivation strong. Second purchase within 14 days for 68% of responders. Margin hit from discount offset by volume.',
                kpiDeltas: { revenue: '+18%', cac: '-10%', cvr: '+12%', retention: '+25%' },
              },
            },
            {
              label: 'Educational series + 2nd purchase incentive',
              consequence: {
                title: 'Education builds consideration — moderate pace',
                description: 'Content series explaining product benefits and routines. Promising segment engagement up 34%. Second purchase rate improving gradually. Full effect takes 60-90 days.',
                kpiDeltas: { revenue: '+8%', cac: '-4%', cvr: '+10%', retention: '+15%' },
              },
            },
            {
              label: 'Onboarding flow — product education + social proof',
              consequence: {
                title: 'New customer experience improved',
                description: 'Welcome sequence with product guides and reviews. First-purchase-to-second gap shortening. New cohort retention curves improving. Foundation for long-term LTV growth.',
                kpiDeltas: { revenue: '+5%', cac: '-6%', cvr: '+7%', retention: '+14%' },
              },
            },
          ],
        },
      ],
    },
  },

  saas: {
    budget: {
      brief: '£120k annual budget. Flowdesk: 3,200 users, MRR £48k, churn 6.8% vs 4% benchmark. Activation rate 31% (signup→first value). NRR 94%. The board wants MRR +50% in 6 months. Study the data across all tabs before your team votes.',
      questions: [
        {
          question: 'Where should the majority of budget go?',
          options: [
            {
              label: 'Paid acquisition — scale signups',
              consequence: {
                title: 'Signups surge, activation stays broken',
                description: 'Signups up 42% but activation rate drops to 27% as lower-intent users flood in. CAC rises to £310. MRR grows 11% but churn compounds. Entering Round 2 with more users but worse unit economics.',
                kpiDeltas: { mrr: '+11%', churn: '+15%', activation: '-13%', nrr: '-4%' },
              },
            },
            {
              label: 'Activation & onboarding — fix first-run experience',
              consequence: {
                title: 'Activation unlocked — existing traffic converts',
                description: 'Activation rate moves from 31% to 52% in 8 weeks. Onboarding redesigned with guided setup and templates. Existing signups converting at nearly double the rate. MRR trajectory strong entering Round 2.',
                kpiDeltas: { mrr: '+22%', churn: '-18%', activation: '+68%', nrr: '+12%' },
              },
            },
            {
              label: 'Sales team expansion — hire 3 AEs',
              consequence: {
                title: 'Sales ramp slow — pipeline building',
                description: 'New AEs take 4 months to ramp. Pipeline growing but closed deals lag. Fixed cost base increases immediately. Some enterprise deals in late stage but no MRR impact yet.',
                kpiDeltas: { mrr: '+6%', churn: '+3%', activation: '+5%', nrr: '+8%' },
              },
            },
            {
              label: 'Brand awareness — content & thought leadership',
              consequence: {
                title: 'Brand grows slowly, metrics unchanged',
                description: 'Podcast sponsorships and content programme launched. Inbound demo requests up 18% but sales cycle long. No near-term MRR impact. Activation and churn unchanged.',
                kpiDeltas: { mrr: '+4%', churn: '+2%', activation: '+6%', nrr: '+3%' },
              },
            },
          ],
        },
        {
          question: 'How should you split acquisition vs activation spend?',
          options: [
            {
              label: '80% acquisition / 20% activation',
              consequence: {
                title: 'Top-heavy — leaky bucket persists',
                description: 'Acquisition channels scaled but activation rate stays at 32%. Most new signups churn within 14 days. CAC payback extends to 18 months. Growth looks good on vanity metrics only.',
                kpiDeltas: { mrr: '+8%', churn: '+10%', activation: '-5%', nrr: '-2%' },
              },
            },
            {
              label: '30% acquisition / 70% activation',
              consequence: {
                title: 'Activation-first — compounding returns',
                description: 'Activation rate improves from 31% to 48%. Every channel becomes more efficient as more signups reach value. CAC payback drops to 6 months. Strong foundation for scaling acquisition later.',
                kpiDeltas: { mrr: '+19%', churn: '-15%', activation: '+55%', nrr: '+10%' },
              },
            },
            {
              label: '50 / 50',
              consequence: {
                title: 'Balanced but underpowered',
                description: 'Neither programme fully funded. Activation improves modestly to 37%. Acquisition adds steady signups. Progress on both fronts but neither hits escape velocity.',
                kpiDeltas: { mrr: '+12%', churn: '-4%', activation: '+19%', nrr: '+5%' },
              },
            },
            {
              label: '10% acquisition / 90% activation',
              consequence: {
                title: 'Activation excellent, pipeline dries up',
                description: 'Activation rate hits 56% — best in class. But new signups decline 22% as acquisition channels go dark. Existing users healthy but total addressable growth constrained.',
                kpiDeltas: { mrr: '+7%', churn: '-20%', activation: '+80%', nrr: '+14%' },
              },
            },
          ],
        },
      ],
    },
    diagnose: {
      brief: 'Month 2: 4,800 signups, 1,920 complete profile, 1,150 create first task, 460 invite team, 184 convert to paid. Churn concentrated in days 3-7. The constraint is specific — find it in the data.',
      questions: [
        {
          question: 'Where is the biggest and most actionable drop?',
          options: [
            {
              label: 'Signup → profile completion',
              consequence: {
                title: 'Signup flow simplified — moderate lift',
                description: 'Profile completion rate improves from 40% to 52%. More users enter the funnel. But the real drop happens downstream — most who complete profiles still never reach first value.',
                kpiDeltas: { mrr: '+7%', churn: '-3%', activation: '+15%', nrr: '+4%' },
              },
            },
            {
              label: 'Profile → first task created',
              consequence: {
                title: 'Empty state solved — activation transforming',
                description: 'First-task rate jumps from 60% to 82% with templates and guided onboarding. Users reach "aha moment" faster. Day-7 retention improves 34%. The downstream funnel benefits from engaged users.',
                kpiDeltas: { mrr: '+18%', churn: '-16%', activation: '+52%', nrr: '+11%' },
              },
            },
            {
              label: 'First task → team invite',
              consequence: {
                title: 'Collaboration nudge added — some improvement',
                description: 'Team invite rate improves from 40% to 48%. Users who invite teammates retain 3x better. But the upstream empty-state problem still causes most users to drop before reaching this step.',
                kpiDeltas: { mrr: '+10%', churn: '-8%', activation: '+20%', nrr: '+7%' },
              },
            },
            {
              label: 'Team invite → paid conversion',
              consequence: {
                title: 'Paywall optimised — conversion up slightly',
                description: 'Paid conversion rate improves from 40% to 46%. Better pricing page and trial extension. But the real volume problem is upstream — not enough users reach this step to move MRR meaningfully.',
                kpiDeltas: { mrr: '+8%', churn: '-2%', activation: '+8%', nrr: '+5%' },
              },
            },
          ],
        },
        {
          question: 'Most likely root cause?',
          options: [
            {
              label: 'Pricing friction — free tier too limited',
              consequence: {
                title: 'Pricing adjusted — trial extended',
                description: 'Free tier expanded and trial lengthened to 21 days. More users explore features. But the core activation problem (users not reaching value) persists regardless of pricing.',
                kpiDeltas: { mrr: '+5%', churn: '-4%', activation: '+10%', nrr: '+3%' },
              },
            },
            {
              label: 'Empty state problem — no guidance after signup',
              consequence: {
                title: 'Root cause nailed — onboarding transforming',
                description: 'Templates, sample projects, and interactive walkthrough added. Time-to-first-value drops from 12 minutes to 3. Day-3 retention jumps 41%. Users reach "aha moment" before losing interest.',
                kpiDeltas: { mrr: '+20%', churn: '-19%', activation: '+65%', nrr: '+13%' },
              },
            },
            {
              label: 'Feature overload — too many options',
              consequence: {
                title: 'UI simplified — modest improvement',
                description: 'Progressive disclosure implemented. New users see simplified interface. Cognitive load reduced. Some activation improvement but the empty-state problem (no starting content) remains partially.',
                kpiDeltas: { mrr: '+9%', churn: '-7%', activation: '+22%', nrr: '+6%' },
              },
            },
            {
              label: 'Missing integrations — no Slack/Jira connection',
              consequence: {
                title: 'Integrations built — power users happy',
                description: 'Slack and Jira integrations launched. Existing power users adopt quickly — NRR improves as teams expand usage. But new user activation unchanged; integrations matter after adoption, not before.',
                kpiDeltas: { mrr: '+6%', churn: '-3%', activation: '+5%', nrr: '+15%' },
              },
            },
          ],
        },
      ],
    },
    rfm: {
      brief: '3,800 active accounts. Power Users (11%) drive 47% of MRR through seat expansion. At-Risk (19%) were active but usage declining for 30+ days. New Users (28%) signed up in last 60 days. Low-Touch (42%) use basic features only. Prior decisions affect your budget and segment health.',
      questions: [
        {
          question: 'Which segment gets the largest success team budget share?',
          options: [
            {
              label: 'Power Users — protect and expand',
              consequence: {
                title: 'Power users maintained — already expanding',
                description: 'Dedicated CSM assigned. Power users appreciate it but expansion was already happening organically. Incremental MRR only £3.2k. At-Risk accounts continue declining without intervention.',
                kpiDeltas: { mrr: '+4%', churn: '+3%', activation: '+2%', nrr: '+6%' },
              },
            },
            {
              label: 'At-Risk — re-engage before churn',
              consequence: {
                title: 'Re-engagement working — high-value accounts saved',
                description: 'Health score alerts trigger CSM outreach at day 14 of declining usage. 24% of At-Risk re-engage (benchmark 15%). Saved accounts worth £18k MRR. Churn rate drops from 6.8% to 4.9%.',
                kpiDeltas: { mrr: '+21%', churn: '-28%', activation: '+10%', nrr: '+18%' },
              },
            },
            {
              label: 'New Users — accelerate to value',
              consequence: {
                title: 'New user success programme — promising results',
                description: 'Onboarding calls and check-ins for new signups. Activation rate improves 18%. Pipeline of healthy accounts building. Full MRR impact takes 90+ days as cohorts mature.',
                kpiDeltas: { mrr: '+10%', churn: '-8%', activation: '+30%', nrr: '+8%' },
              },
            },
            {
              label: 'Low-Touch — upgrade to higher tiers',
              consequence: {
                title: 'Upgrade campaign — low conversion',
                description: 'Feature education and upgrade prompts sent to Low-Touch segment. 4% upgrade (benchmark 6%). Most are content with basic features. Some annoyance at upsell pressure.',
                kpiDeltas: { mrr: '+5%', churn: '+4%', activation: '+3%', nrr: '+7%' },
              },
            },
          ],
        },
        {
          question: 'What is the primary mechanic?',
          options: [
            {
              label: 'Account expansion — seat & feature upsell',
              consequence: {
                title: 'Expansion revenue growing — limited reach',
                description: 'Seat-based expansion prompts and feature upsells for power users. NRR improves to 108%. But only affects accounts already deeply engaged — does not address churn in other segments.',
                kpiDeltas: { mrr: '+6%', churn: '+2%', activation: '+3%', nrr: '+14%' },
              },
            },
            {
              label: 'Win-back sequence — re-engagement campaign',
              consequence: {
                title: 'Win-back driving reactivation — strong ROI',
                description: 'Personalised win-back emails with usage reports and new feature highlights. 21% of At-Risk re-engage within 30 days. Reactivated accounts show 78% 90-day retention. High-ROI mechanic.',
                kpiDeltas: { mrr: '+17%', churn: '-22%', activation: '+12%', nrr: '+16%' },
              },
            },
            {
              label: 'Automated onboarding — guided setup flow',
              consequence: {
                title: 'Onboarding automated — scalable activation',
                description: 'Interactive product tours and milestone-based emails. New user activation improves 26%. Reduces CSM load. Long-term healthy but near-term MRR impact modest as cohorts are small.',
                kpiDeltas: { mrr: '+8%', churn: '-10%', activation: '+35%', nrr: '+7%' },
              },
            },
            {
              label: 'Self-serve knowledge base — docs & video library',
              consequence: {
                title: 'Knowledge base launched — support tickets down',
                description: 'Comprehensive docs and video tutorials reduce support volume 32%. User satisfaction improves. Some activation lift from better self-serve discovery. Indirect MRR impact via reduced churn.',
                kpiDeltas: { mrr: '+4%', churn: '-6%', activation: '+14%', nrr: '+5%' },
              },
            },
          ],
        },
      ],
    },
  },

  market: {
    budget: {
      brief: '£90k quarterly budget. Stackd: freelancer marketplace, 1,800 sellers, 6,200 buyers. GMV £420k/mo, take rate 12%. Buyer-to-seller ratio 3.4:1 (target 5:1). Seller 90-day retention 58%. Board wants GMV +60% in two quarters. Study the data across all tabs before your team votes.',
      questions: [
        {
          question: 'Which side of the marketplace needs budget priority?',
          options: [
            {
              label: 'More sellers — expand supply',
              consequence: {
                title: 'Supply floods, demand unchanged',
                description: 'Seller count up 35% but buyer-to-seller ratio drops to 2.5:1. Sellers compete for same demand. Seller earnings decline 18%. Seller churn accelerates. GMV grows only 8% as transactions stay flat.',
                kpiDeltas: { gmv: '+8%', buyerSellerRatio: '-26%', sellerRetention: '-14%', takeRate: '+2%' },
              },
            },
            {
              label: 'More buyers — drive demand',
              consequence: {
                title: 'Demand grows — marketplace liquidity improving',
                description: 'Buyer acquisition drives ratio from 3.4:1 toward 5.2:1. Sellers receive more enquiries — earnings up 22%. Seller retention improves as the platform delivers value. GMV trajectory strong.',
                kpiDeltas: { gmv: '+24%', buyerSellerRatio: '+47%', sellerRetention: '+18%', takeRate: '+5%' },
              },
            },
            {
              label: 'Both equally — balanced growth',
              consequence: {
                title: 'Spread thin — moderate progress',
                description: 'Both sides grow proportionally. Ratio stays at 3.5:1. GMV increases from volume but marketplace dynamics unchanged. Neither side reaches critical density for network effects.',
                kpiDeltas: { gmv: '+14%', buyerSellerRatio: '+3%', sellerRetention: '+6%', takeRate: '+2%' },
              },
            },
            {
              label: 'Neither — invest in matching algorithm',
              consequence: {
                title: 'Algorithm improves, growth stalls',
                description: 'Search and matching quality improves. Conversion rate on existing traffic up 15%. But without new demand, total GMV lift modest. Existing sellers see slight improvement. Long-term foundation solid.',
                kpiDeltas: { gmv: '+10%', buyerSellerRatio: '+5%', sellerRetention: '+8%', takeRate: '+3%' },
              },
            },
          ],
        },
        {
          question: 'What is the most effective buyer acquisition channel?',
          options: [
            {
              label: 'Programmatic display — broad reach',
              consequence: {
                title: 'Impressions high, intent low',
                description: 'Display drives awareness but buyer quality is poor. Bounce rate 72%. Cost per qualified buyer £48. Some brand lift but most visitors never complete a hire. Ratio improves marginally.',
                kpiDeltas: { gmv: '+6%', buyerSellerRatio: '+12%', sellerRetention: '+3%', takeRate: '+1%' },
              },
            },
            {
              label: 'SEO & content — high-intent organic',
              consequence: {
                title: 'Content builds pipeline — 3-month lag',
                description: 'Buyer guides and category pages created. Organic traffic growing 8% monthly but compounding effect takes time. High-intent visitors when they arrive — conversion rate 2.4x paid. Full impact in Q2.',
                kpiDeltas: { gmv: '+9%', buyerSellerRatio: '+18%', sellerRetention: '+7%', takeRate: '+3%' },
              },
            },
            {
              label: 'Influencer partnerships — social proof',
              consequence: {
                title: 'Viral moments, inconsistent flow',
                description: 'Influencer campaigns drive spikes of buyer traffic. Some sellers overwhelmed by demand surges. Hard to predict or sustain. When it works, conversion excellent. Overall effect lumpy but positive.',
                kpiDeltas: { gmv: '+15%', buyerSellerRatio: '+28%', sellerRetention: '+5%', takeRate: '+2%' },
              },
            },
            {
              label: 'Direct sales outreach — B2B buyers',
              consequence: {
                title: 'Enterprise buyers — high AOV, long cycle',
                description: 'Direct outreach lands 12 enterprise accounts. Average project size £8.2k vs marketplace average £340. GMV boost significant per deal. But pipeline slow and CAC high. Seller retention improves as top sellers get large projects.',
                kpiDeltas: { gmv: '+18%', buyerSellerRatio: '+22%', sellerRetention: '+12%', takeRate: '+4%' },
              },
            },
          ],
        },
      ],
    },
    diagnose: {
      brief: 'Month 2: 8,400 searches, 3,200 profile views, 1,120 messages sent, 640 bookings, 520 completed projects. Seller profile completion averaging 54%. The constraint is specific — find it in the data.',
      questions: [
        {
          question: 'Where is the biggest and most actionable constraint?',
          options: [
            {
              label: 'Search & discovery — buyers can\'t find the right seller',
              consequence: {
                title: 'Search improved — more profiles viewed',
                description: 'Search algorithm refined with better filters and relevance scoring. Profile views per search up 38%. More buyers finding potential matches. But profile quality still causes drop-off at the next step.',
                kpiDeltas: { gmv: '+10%', buyerSellerRatio: '+8%', sellerRetention: '+6%', takeRate: '+2%' },
              },
            },
            {
              label: 'Profile quality — sellers not showcasing work',
              consequence: {
                title: 'Profile quality transformed — conversion unlocked',
                description: 'Guided profile builder with portfolio templates and review prompts. Profile completion jumps from 54% to 78%. Message-to-booking rate improves 44%. Buyers trust what they see. GMV trajectory strong.',
                kpiDeltas: { gmv: '+22%', buyerSellerRatio: '+12%', sellerRetention: '+20%', takeRate: '+5%' },
              },
            },
            {
              label: 'Pricing transparency — unclear costs',
              consequence: {
                title: 'Pricing standardised — some improvement',
                description: 'Rate cards and pricing guides introduced. Buyer enquiry-to-booking rate improves 18%. But core issue is buyers reaching poor-quality profiles first. Price clarity helps those already engaged.',
                kpiDeltas: { gmv: '+12%', buyerSellerRatio: '+6%', sellerRetention: '+10%', takeRate: '+3%' },
              },
            },
            {
              label: 'Communication — no booking/messaging system',
              consequence: {
                title: 'Messaging upgraded — response times drop',
                description: 'In-app messaging with templates and scheduling. Response time drops from 18h to 4h. Booking rate improves for conversations that start. But many buyers leave before messaging due to profile quality.',
                kpiDeltas: { gmv: '+8%', buyerSellerRatio: '+5%', sellerRetention: '+12%', takeRate: '+4%' },
              },
            },
          ],
        },
        {
          question: 'Most likely root cause?',
          options: [
            {
              label: 'Search algorithm bias — top sellers dominate results',
              consequence: {
                title: 'Search rebalanced — mid-tier sellers visible',
                description: 'Algorithm adjusted to surface newer and mid-tier sellers. Distribution of bookings improves. Some top sellers see slight decline. Overall marketplace health improves as more sellers earn.',
                kpiDeltas: { gmv: '+7%', buyerSellerRatio: '+4%', sellerRetention: '+14%', takeRate: '+2%' },
              },
            },
            {
              label: 'Profile completion gap — sellers don\'t know what to add',
              consequence: {
                title: 'Root cause nailed — profiles transforming',
                description: 'Step-by-step profile wizard with examples, prompts for portfolio items, and automated review requests. Profile completion 54% → 81%. Seller profiles now convert 2.1x better. Network effects strengthening.',
                kpiDeltas: { gmv: '+20%', buyerSellerRatio: '+10%', sellerRetention: '+22%', takeRate: '+6%' },
              },
            },
            {
              label: 'Category taxonomy — buyers searching wrong terms',
              consequence: {
                title: 'Taxonomy improved — search friction reduced',
                description: 'Categories restructured with synonyms and auto-suggestions. Search-to-profile-view rate up 25%. Helpful but the underlying profile quality issue still limits downstream conversion.',
                kpiDeltas: { gmv: '+9%', buyerSellerRatio: '+7%', sellerRetention: '+8%', takeRate: '+3%' },
              },
            },
            {
              label: 'No booking system — conversations go off-platform',
              consequence: {
                title: 'Booking system launched — take rate protected',
                description: 'Integrated booking and payment system reduces off-platform leakage. Take rate captured on 22% more transactions. GMV reporting improves. But doesn\'t address why some sellers never get enquiries.',
                kpiDeltas: { gmv: '+11%', buyerSellerRatio: '+3%', sellerRetention: '+9%', takeRate: '+12%' },
              },
            },
          ],
        },
      ],
    },
    rfm: {
      brief: '6,200 buyers segmented. High-Value Repeat (8%) drive 38% of GMV with 4.2 avg bookings. Lapsed High-Value (14%) spent £2k+ but no booking in 60 days. Recent First-Timers (32%) completed one project in last 45 days. Browsers (46%) searched but never booked. Prior decisions affect your budget and segment health.',
      questions: [
        {
          question: 'Which buyer segment gets the largest engagement budget?',
          options: [
            {
              label: 'High-Value Repeat — loyalty & retention',
              consequence: {
                title: 'Top buyers rewarded — low incrementality',
                description: 'Priority support and fee discounts for top buyers. Satisfaction high but most bookings were happening anyway. Incremental GMV only £12k. Lapsed buyers continue drifting without intervention.',
                kpiDeltas: { gmv: '+4%', buyerSellerRatio: '+2%', sellerRetention: '+5%', takeRate: '-3%' },
              },
            },
            {
              label: 'Lapsed High-Value — win back big spenders',
              consequence: {
                title: 'Win-back succeeding — high-value reactivating',
                description: 'Personalised outreach with curated seller recommendations. 22% of Lapsed re-book within 30 days (benchmark 14%). Average reactivation project £1.8k. £52k incremental GMV. Strong ROI.',
                kpiDeltas: { gmv: '+20%', buyerSellerRatio: '+15%', sellerRetention: '+16%', takeRate: '+4%' },
              },
            },
            {
              label: 'Recent First-Timers — drive second booking',
              consequence: {
                title: 'Second booking nudge — solid conversion',
                description: 'Post-project follow-up with related seller suggestions. 16% make second booking within 45 days. Building repeat buyer base. GMV uplift £28k. Long-term compounding as cohort matures.',
                kpiDeltas: { gmv: '+12%', buyerSellerRatio: '+10%', sellerRetention: '+10%', takeRate: '+3%' },
              },
            },
            {
              label: 'Browsers — convert to first booking',
              consequence: {
                title: 'Browser conversion — low yield',
                description: 'Retargeting and email nudges to browsers. 3% convert to first booking. Large segment so absolute numbers decent. But intent is low and CAC high. Some new GMV but efficiency poor.',
                kpiDeltas: { gmv: '+7%', buyerSellerRatio: '+18%', sellerRetention: '+3%', takeRate: '+1%' },
              },
            },
          ],
        },
        {
          question: 'What is the primary mechanic?',
          options: [
            {
              label: 'Loyalty programme — repeat booking rewards',
              consequence: {
                title: 'Loyalty programme launched — gradual adoption',
                description: 'Points-based rewards for repeat bookings. Top buyers engage immediately. 14% increase in booking frequency among enrolled users. Take rate pressure from rewards offset by volume. Steady growth.',
                kpiDeltas: { gmv: '+8%', buyerSellerRatio: '+5%', sellerRetention: '+8%', takeRate: '-2%' },
              },
            },
            {
              label: 'Win-back campaign — personalised re-engagement',
              consequence: {
                title: 'Win-back driving high-value reactivation',
                description: 'Curated seller shortlists based on past projects sent to lapsed buyers. "We found new talent for you" positioning. 19% reactivation rate. Average re-booking value £1.6k. Strong ROI on campaign spend.',
                kpiDeltas: { gmv: '+18%', buyerSellerRatio: '+12%', sellerRetention: '+14%', takeRate: '+5%' },
              },
            },
            {
              label: 'Post-hire nudge — review & rebook prompt',
              consequence: {
                title: 'Post-project loop created — repeat rate improving',
                description: 'Automated review request → "book again" → "explore similar sellers" flow. Review completion up 40%. Second booking rate improves 22%. Virtuous cycle as reviews improve seller profiles.',
                kpiDeltas: { gmv: '+14%', buyerSellerRatio: '+8%', sellerRetention: '+12%', takeRate: '+3%' },
              },
            },
            {
              label: 'Onboarding — guided first booking experience',
              consequence: {
                title: 'First booking simplified — browser conversion up',
                description: 'Step-by-step booking wizard with budget estimator and seller recommendations. Browser-to-first-booking rate improves 28%. New buyer quality higher. But volume from browser segment still modest.',
                kpiDeltas: { gmv: '+6%', buyerSellerRatio: '+14%', sellerRetention: '+5%', takeRate: '+2%' },
              },
            },
          ],
        },
      ],
    },
  },

  media: {
    budget: {
      brief: '£35k quarterly budget. The Brief: B2B newsletter, 18,400 subscribers, CPS £2.80 (target £1.50). Open rate 38%. Sponsor revenue £8.2k/mo with 2 slots. Goal: 40k subscribers and £18k/mo sponsor revenue in 6 months. Study the data across all tabs before your team votes.',
      questions: [
        {
          question: 'Where should the majority of growth budget go?',
          options: [
            {
              label: 'Paid acquisition — Meta & LinkedIn ads',
              consequence: {
                title: 'Subscribers surge but quality drops',
                description: 'Subscriber count up 44% but open rate drops to 31% as lower-intent signups dilute the list. CPS rises to £3.40. Sponsor CPM decreases. Volume up but engagement metrics weaken entering Round 2.',
                kpiDeltas: { subscribers: '+44%', cps: '+21%', openRate: '-18%', sponsorRevenue: '+8%' },
              },
            },
            {
              label: 'Referral programme — subscriber-led growth',
              consequence: {
                title: 'Referral flywheel building — high-quality growth',
                description: 'Referral programme with milestone rewards launches. Referred subscribers open at 52% vs 38% average. Growth rate 12% monthly. CPS drops as referrals are nearly free. Sponsor value increasing with engagement.',
                kpiDeltas: { subscribers: '+28%', cps: '-35%', openRate: '+8%', sponsorRevenue: '+18%' },
              },
            },
            {
              label: 'Content partnerships — cross-promotions',
              consequence: {
                title: 'Partner swaps growing — steady additions',
                description: 'Newsletter swaps with 6 complementary publications. 2,400 new subscribers at near-zero cost. Audience quality strong as readers already consume similar content. Growth steady but dependent on partner pipeline.',
                kpiDeltas: { subscribers: '+18%', cps: '-28%', openRate: '+5%', sponsorRevenue: '+12%' },
              },
            },
            {
              label: 'SEO & web archive — evergreen discovery',
              consequence: {
                title: 'Archive builds slowly — long-term play',
                description: 'Past issues published as SEO-optimised articles. Organic traffic growing 6% monthly but conversion to subscriber takes time. Quality high but volume low in near-term. Foundation for compounding growth.',
                kpiDeltas: { subscribers: '+8%', cps: '-12%', openRate: '+3%', sponsorRevenue: '+5%' },
              },
            },
          ],
        },
        {
          question: 'How should you split paid vs organic/referral spend?',
          options: [
            {
              label: '80% paid / 20% organic & referral',
              consequence: {
                title: 'Paid-heavy — growth fast, engagement diluted',
                description: 'Subscriber growth accelerates but open rate drops to 33%. CPS increases as paid channels get more expensive. Sponsor rates under pressure from lower engagement. Growth that erodes value.',
                kpiDeltas: { subscribers: '+38%', cps: '+18%', openRate: '-13%', sponsorRevenue: '+4%' },
              },
            },
            {
              label: '30% paid / 70% organic & referral',
              consequence: {
                title: 'Organic-first — sustainable high-quality growth',
                description: 'Referral programme and partnerships drive majority of growth. Subscribers up 22% with open rate holding at 39%. CPS drops 30%. Sponsor rates increase as engagement metrics strengthen.',
                kpiDeltas: { subscribers: '+22%', cps: '-30%', openRate: '+3%', sponsorRevenue: '+20%' },
              },
            },
            {
              label: '50 / 50',
              consequence: {
                title: 'Balanced — moderate on all fronts',
                description: 'Paid brings volume, organic brings quality. Net open rate holds at 36%. Subscriber growth steady at 18%. CPS improves slightly. Neither channel fully optimised but progress across the board.',
                kpiDeltas: { subscribers: '+18%', cps: '-8%', openRate: '-5%', sponsorRevenue: '+10%' },
              },
            },
            {
              label: '10% paid / 90% organic & referral',
              consequence: {
                title: 'Organic purity — quality high, growth slow',
                description: 'Open rate improves to 42% and engagement excellent. Sponsors love the metrics. But growth rate only 8% — 40k target at serious risk. Revenue per subscriber strong but total revenue constrained by base size.',
                kpiDeltas: { subscribers: '+8%', cps: '-38%', openRate: '+11%', sponsorRevenue: '+14%' },
              },
            },
          ],
        },
      ],
    },
    diagnose: {
      brief: 'Month 2: 22,600 subscribers, 38% open rate, 12% click rate, 2.1% sponsor click rate. Unsubscribe rate 0.8% per send. 34% of list hasn\'t opened in 30 days. The constraint is specific — find it in the data.',
      questions: [
        {
          question: 'Where is the biggest and most actionable problem?',
          options: [
            {
              label: 'Deliverability — emails hitting spam',
              consequence: {
                title: 'Deliverability audit — some gains',
                description: 'SPF/DKIM/DMARC configured. Inactive subscribers suppressed from sends. Inbox placement improves from 82% to 91%. Open rate lifts mechanically. But content engagement unchanged — opens don\'t become clicks.',
                kpiDeltas: { subscribers: '+3%', cps: '-5%', openRate: '+12%', sponsorRevenue: '+6%' },
              },
            },
            {
              label: 'Subject lines — not compelling enough',
              consequence: {
                title: 'Subject line testing — open rate improving',
                description: 'A/B testing programme with curiosity-driven subject lines. Open rate improves from 38% to 44%. More eyeballs on content and sponsors. Click rate follows proportionally. Strong improvement across metrics.',
                kpiDeltas: { subscribers: '+5%', cps: '-8%', openRate: '+16%', sponsorRevenue: '+15%' },
              },
            },
            {
              label: 'Content engagement — readers open but don\'t click',
              consequence: {
                title: 'Content restructured — engagement transforming',
                description: 'Content reformatted with stronger hooks, clearer CTAs, and opinionated takes. Click rate jumps from 12% to 19%. Sponsor click rate improves 42%. Readers forwarding more — organic growth accelerating.',
                kpiDeltas: { subscribers: '+10%', cps: '-14%', openRate: '+8%', sponsorRevenue: '+24%' },
              },
            },
            {
              label: 'Sponsor placement — ads not integrated well',
              consequence: {
                title: 'Sponsor format redesigned — click rates up',
                description: 'Native ad format replacing banner-style placement. Sponsor click rate improves from 2.1% to 3.4%. Sponsors renewing at higher rates. But overall list engagement unchanged — sponsors benefit from better format only.',
                kpiDeltas: { subscribers: '+2%', cps: '-3%', openRate: '+2%', sponsorRevenue: '+18%' },
              },
            },
          ],
        },
        {
          question: 'Most likely root cause?',
          options: [
            {
              label: 'Send time — wrong time of day/week',
              consequence: {
                title: 'Send time optimised — modest lift',
                description: 'Send time testing reveals Tuesday 7:30am outperforms Friday 9am by 14% on opens. Quick win implemented. But the content itself remains the bigger lever — timing helps at the margins.',
                kpiDeltas: { subscribers: '+2%', cps: '-3%', openRate: '+8%', sponsorRevenue: '+5%' },
              },
            },
            {
              label: 'Too many links — overwhelming readers',
              consequence: {
                title: 'Link count reduced — focus improved',
                description: 'Edition trimmed from 12 links to 5 curated picks with commentary. Click-through rate on remaining links improves 34%. Readers report feeling less overwhelmed. Quality over quantity working.',
                kpiDeltas: { subscribers: '+4%', cps: '-6%', openRate: '+5%', sponsorRevenue: '+10%' },
              },
            },
            {
              label: 'Content not opinionated enough — no unique voice',
              consequence: {
                title: 'Root cause nailed — voice sharpening',
                description: 'Editorial stance shifts from curation to opinion-led analysis. "Hot takes" section added. Forward rate triples. Reply rate up 280%. Readers become advocates. Organic growth accelerating as content earns attention.',
                kpiDeltas: { subscribers: '+14%', cps: '-18%', openRate: '+12%', sponsorRevenue: '+22%' },
              },
            },
            {
              label: 'Design issues — hard to read on mobile',
              consequence: {
                title: 'Mobile redesign — readability improved',
                description: 'Single-column mobile-first redesign. Font size increased. CTA buttons enlarged. Mobile open-to-click rate improves 22%. Helpful for 64% of readers on mobile. But content substance is the bigger driver.',
                kpiDeltas: { subscribers: '+3%', cps: '-4%', openRate: '+4%', sponsorRevenue: '+8%' },
              },
            },
          ],
        },
      ],
    },
    rfm: {
      brief: '22,600 subscribers segmented. Loyal Openers (24%) open 90%+ of editions and drive 62% of sponsor clicks. Occasional (31%) open 30-60% of editions. Ghosts (28%) haven\'t opened in 45+ days. New Subscribers (17%) joined in last 30 days. Prior decisions affect your budget and segment health.',
      questions: [
        {
          question: 'Which segment gets the largest monetisation focus?',
          options: [
            {
              label: 'Loyal Openers — premium monetisation',
              consequence: {
                title: 'Premium tier launched — strong early adoption',
                description: 'Paid tier at £8/mo with deep-dive analysis and community access. 6% of Loyal Openers convert. £980/mo recurring revenue. Diversifies from sponsor-only model. High-value readers feel recognised.',
                kpiDeltas: { subscribers: '+2%', cps: '-4%', openRate: '+5%', sponsorRevenue: '+8%' },
              },
            },
            {
              label: 'Occasional — increase frequency to loyal',
              consequence: {
                title: 'Re-engagement working — occasional readers warming',
                description: 'Targeted re-engagement with "best of" digests and personalised content picks. 18% of Occasional segment moves to Loyal within 60 days. Sponsor click pool grows. List health improves significantly.',
                kpiDeltas: { subscribers: '+4%', cps: '-10%', openRate: '+14%', sponsorRevenue: '+20%' },
              },
            },
            {
              label: 'Ghosts — reactivate or clean',
              consequence: {
                title: 'List cleaned — engagement metrics jump',
                description: 'Win-back sequence sent to Ghosts: 8% re-engage, rest suppressed. List shrinks 22% but open rate jumps to 48%. Sponsor CPMs increase dramatically. Higher rates offset smaller list. Deliverability improves.',
                kpiDeltas: { subscribers: '-18%', cps: '-32%', openRate: '+26%', sponsorRevenue: '+15%' },
              },
            },
            {
              label: 'New Subscribers — welcome & activate',
              consequence: {
                title: 'Welcome sequence built — early retention improving',
                description: 'Five-part welcome sequence introducing best content, editorial voice, and community. Day-30 retention improves from 71% to 84%. New cohorts entering Loyal segment faster. Long-term list health building.',
                kpiDeltas: { subscribers: '+8%', cps: '-8%', openRate: '+6%', sponsorRevenue: '+7%' },
              },
            },
          ],
        },
        {
          question: 'What is the primary mechanic?',
          options: [
            {
              label: 'Premium tier — paid subscription',
              consequence: {
                title: 'Premium diversifies revenue — slow build',
                description: 'Paid tier with exclusive analysis, Q&A, and community. 4.2% of engaged subscribers convert at £8/mo. £680/mo new revenue stream. Sponsors unaffected as free tier remains. Revenue diversification begins.',
                kpiDeltas: { subscribers: '+3%', cps: '-5%', openRate: '+4%', sponsorRevenue: '+6%' },
              },
            },
            {
              label: 'Re-engagement drip — win back occasionals',
              consequence: {
                title: 'Drip sequence reactivating readers — strong ROI',
                description: 'Personalised re-engagement based on past click behaviour. "We noticed you liked X — here\'s more" positioning. 21% of Occasional move to Loyal. Sponsor click pool grows 28%. High-leverage mechanic.',
                kpiDeltas: { subscribers: '+5%', cps: '-12%', openRate: '+16%', sponsorRevenue: '+22%' },
              },
            },
            {
              label: 'Welcome sequence — new subscriber activation',
              consequence: {
                title: 'Welcome flow driving early loyalty',
                description: 'Automated 5-email sequence: best-of content, editorial manifesto, community invite, feedback request, referral prompt. Day-14 open rate for new subscribers improves from 44% to 62%. Foundation for long-term growth.',
                kpiDeltas: { subscribers: '+10%', cps: '-10%', openRate: '+8%', sponsorRevenue: '+9%' },
              },
            },
            {
              label: 'Referral programme — subscriber-powered growth',
              consequence: {
                title: 'Referral loop accelerating growth',
                description: 'Milestone rewards (3 referrals = sticker, 10 = mug, 25 = premium access). 8% of subscribers refer at least once. Growth rate doubles. Referred subscribers 40% more likely to become Loyal. CPS drops significantly.',
                kpiDeltas: { subscribers: '+22%', cps: '-28%', openRate: '+3%', sponsorRevenue: '+12%' },
              },
            },
          ],
        },
      ],
    },
  },
  ecom: {
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
                description: 'GMV grows 28% as TikTok paid promotion drives volume. But platform fee cost increases to £340k annually. Owned channel share drops to 12%. More profitable short-term but more exposed to future fee changes.',
                kpiDeltas: { revenue: '+28%', cac: '+18%', cvr: '+5%', retention: '-8%' },
              },
            },
            {
              label: 'Invest in DTC website — UX, checkout, and paid traffic',
              consequence: {
                title: 'Owned channel starts to build — slow but structural',
                description: 'DTC CVR improves from 0.4% to 1.1% after UX and checkout overhaul. DTC revenue share rises to 22%. CAC on DTC remains high at £68 — growing but not yet efficient.',
                kpiDeltas: { revenue: '+8%', cac: '-12%', cvr: '+175%', retention: '+18%' },
              },
            },
            {
              label: 'Build owned channels — email list growth and CRM infrastructure',
              consequence: {
                title: 'Owned audience compounds — revenue lags short-term',
                description: 'Email list grows from 18k to 41k in 6 months. Email revenue doubles. Short-term GMV growth modest but the owned asset being built has compounding long-term value.',
                kpiDeltas: { revenue: '+12%', cac: '-22%', cvr: '+15%', retention: '+34%' },
              },
            },
            {
              label: 'Diversify to Instagram Shopping and YouTube — reduce single-platform risk',
              consequence: {
                title: 'Portfolio approach — diluted execution across all channels',
                description: 'Neither Instagram nor YouTube reaches critical scale in 6 months. Budget spread too thinly. TikTok dependency reduces marginally to 71%. Team bandwidth stretched.',
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
                description: 'Platform fee cost rises to £262k annually. Gross margin compresses to 47%. Business remains profitable on TikTok at scale but more exposed to further fee increases.',
                kpiDeltas: { revenue: '+4%', cac: '+2%', cvr: '+3%', retention: '-2%' },
              },
            },
            {
              label: 'Negotiate volume discount — use GMV scale as leverage',
              consequence: {
                title: 'Partial fee reduction secured — 6% blended rate',
                description: 'TikTok agrees to a 6% blended rate for volume commitment. Fee cost reduces by £84k annually. But the commitment reduces flexibility to cut TikTok spend later.',
                kpiDeltas: { revenue: '+6%', cac: '-4%', cvr: '+2%', retention: '+2%' },
              },
            },
            {
              label: 'Reduce TikTok GMV to manage fee exposure — accept lower revenue short-term',
              consequence: {
                title: 'Fee exposure managed — revenue gap hard to fill quickly',
                description: 'TikTok GMV reduces 22% as paid promotion is scaled back. Fee cost falls to £180k. The GMV gap only partially offset by DTC and email growth. Net revenue declines 14% short-term.',
                kpiDeltas: { revenue: '-14%', cac: '-18%', cvr: '+8%', retention: '+12%' },
              },
            },
            {
              label: 'Migrate top TikTok customers to DTC with exclusive first-order offers',
              consequence: {
                title: 'High-value migration succeeds — Platform Loyalists move',
                description: 'First-order DTC discount converts 24% of Platform Loyalists to email subscribers. Owned channel share rises to 26%. DTC retention among converted customers strong at 34%.',
                kpiDeltas: { revenue: '+3%', cac: '-14%', cvr: '+20%', retention: '+28%' },
              },
            },
          ],
        },
      ],
    },
    diagnose: {
      brief: 'Month 6: DTC website has received investment but CVR is 1.1% — still well below 2.2% benchmark. 68k unique DTC visitors last month, only 748 purchases. Email list now at 31k but CTOR is 4.2% vs 11% benchmark. Where is the owned channel strategy breaking down?',
      questions: [
        {
          question: 'Where is the biggest conversion failure in the owned channel?',
          options: [
            {
              label: 'DTC website checkout — too many steps, no social proof at purchase',
              consequence: {
                title: 'Checkout friction fixed — DTC CVR recovers strongly',
                description: 'One-page checkout, trust badges, and UGC reviews at cart stage. DTC CVR improves from 1.1% to 2.0%. Monthly DTC revenue increases £28k. Addresses the right constraint.',
                kpiDeltas: { revenue: '+18%', cac: '-14%', cvr: '+82%', retention: '+8%' },
              },
            },
            {
              label: 'Email content — promotional not editorial, not building purchase intent',
              consequence: {
                title: 'Email content shift — CTOR doubles but DTC CVR unchanged',
                description: 'Shift from promotional blasts to editorial content. CTOR rises from 4.2% to 9.1%. Email-driven revenue increases 48%. But DTC checkout CVR unchanged — email was a real problem but not the only one.',
                kpiDeltas: { revenue: '+12%', cac: '-8%', cvr: '+24%', retention: '+22%' },
              },
            },
            {
              label: 'Audience mismatch — TikTok audience is not the same persona as DTC buyer',
              consequence: {
                title: 'Traffic quality improves — CVR recovers partially',
                description: 'Paid DTC traffic refocused on lookalikes of existing DTC buyers. DTC CVR rises to 1.6%. CAC on DTC reduces from £68 to £44. Correct insight but checkout friction still exists.',
                kpiDeltas: { revenue: '+9%', cac: '-18%', cvr: '+45%', retention: '+6%' },
              },
            },
            {
              label: 'Product discovery — DTC site lacks algorithm-driven discovery TikTok provides',
              consequence: {
                title: 'Discovery UX improved — marginal CVR gain only',
                description: 'Recommendation engine and quiz-based product finder added. CVR only improves to 1.3% — discovery was a secondary constraint. Checkout friction remains the bigger gap.',
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
                description: 'Giveaway-acquired subscribers removed. List drops from 31k to 19k but CTOR rises to 8.4%. Email revenue per subscriber increases 3.1x. Smaller higher-quality list outperforms the large disengaged one.',
                kpiDeltas: { revenue: '+8%', cac: '-6%', cvr: '+12%', retention: '+28%' },
              },
            },
            {
              label: 'Send frequency — too many emails, subscribers are fatigued',
              consequence: {
                title: 'Frequency reduced — open rate and engagement recover',
                description: 'Weekly send reduced to fortnightly. Unsubscribe rate falls from 0.8% to 0.2%. CTOR rises to 7.1%. Reduced frequency also allows higher content quality per send.',
                kpiDeltas: { revenue: '+6%', cac: '-2%', cvr: '+8%', retention: '+16%' },
              },
            },
            {
              label: 'Content relevance — same message to all subscribers regardless of history',
              consequence: {
                title: 'Segmented sends — CTOR improves most significantly',
                description: 'Three segments created: new, repeat buyers, lapsed. Personalised content per segment. CTOR rises to 9.8%. Revenue per email send increases 2.4x. Segmentation was the highest-leverage fix.',
                kpiDeltas: { revenue: '+14%', cac: '-10%', cvr: '+18%', retention: '+32%' },
              },
            },
            {
              label: 'Subject lines — not compelling enough to drive opens in a crowded inbox',
              consequence: {
                title: 'Open rate improves — CTOR stays flat',
                description: 'A/B testing on subject lines improves open rate from 28% to 36%. But CTOR stays at 4.4% — the content inside is still not compelling. Open rate was a symptom, not the root cause.',
                kpiDeltas: { revenue: '+3%', cac: '-2%', cvr: '+4%', retention: '+6%' },
              },
            },
          ],
        },
      ],
    },
    rfm: {
      brief: 'Month 9: DTC CVR improved to 1.8%, email list at 38k with CTOR 9.2%. Owned channel now 26% of revenue. Platform fee exposure still £214k annually. £90k CRM budget to deploy. Where do you invest to compound owned channel growth most efficiently?',
      questions: [
        {
          question: 'Which customer segment gets the largest CRM budget share?',
          options: [
            {
              label: 'Owned Champions — reward and retain highest-LTV customers',
              consequence: {
                title: 'Champions retained — diminishing returns on already-loyal base',
                description: 'Loyalty programme launched. Champions increase frequency 12%. Net incremental revenue £31k. But Champions were already at 38% repeat — investment yields diminishing returns on a segment already performing well.',
                kpiDeltas: { revenue: '+8%', cac: '-4%', cvr: '+6%', retention: '+14%' },
              },
            },
            {
              label: 'Platform Loyalists — migrate TikTok buyers to owned channels',
              consequence: {
                title: 'Platform-to-owned migration succeeds — structural shift',
                description: 'First-order DTC discount converts 31% of targeted Platform Loyalists. 5,600 customers migrate to email and DTC. Owned channel share rises to 34%. Converted customers retain at 36%. Highest strategic leverage.',
                kpiDeltas: { revenue: '+18%', cac: '-24%', cvr: '+22%', retention: '+38%' },
              },
            },
            {
              label: 'Email Engaged — develop mid-funnel subscribers into repeat DTC buyers',
              consequence: {
                title: 'Email-to-DTC conversion improves — solid but secondary lever',
                description: '2nd purchase incentive sequence converts 28% of Email Engaged to repeat DTC buyers. LTV increases from £32 to £54. Revenue from segment increases £48k. Good return but smaller lever than Platform Loyalist migration.',
                kpiDeltas: { revenue: '+12%', cac: '-12%', cvr: '+14%', retention: '+24%' },
              },
            },
            {
              label: 'One-and-Done — win back 102k single-purchase customers',
              consequence: {
                title: 'Large bet, thin margins — reactivation disappoints',
                description: 'Win-back campaign to 102k one-and-done achieves 4.2% reactivation — below 8% target. Budget spread thinly across too large a segment at £20 AOV. Incremental revenue but poor margin.',
                kpiDeltas: { revenue: '+6%', cac: '+14%', cvr: '+8%', retention: '-4%' },
              },
            },
          ],
        },
        {
          question: 'What is the primary mechanic for reducing platform dependency?',
          options: [
            {
              label: 'Email capture incentive on TikTok — discount code for sign-up in-video',
              consequence: {
                title: 'Email list grows rapidly — quality is mixed',
                description: 'In-video discount code drives 14k new sign-ups in 60 days. List reaches 52k. But 34% are discount-hunters who do not convert to full-price buyers. Cost per quality subscriber: £6.80.',
                kpiDeltas: { revenue: '+9%', cac: '-8%', cvr: '+10%', retention: '+12%' },
              },
            },
            {
              label: 'Subscription model — monthly replenishment subscription for hero SKU',
              consequence: {
                title: 'Subscription launches — predictable owned revenue stream',
                description: 'Monthly serum subscription at £22/mo attracts 2,100 subscribers in 90 days. £46k MRR fully on DTC, fully off-platform. Churn 8%/month. Subscription LTV projects to £96 — above Owned Champions LTV.',
                kpiDeltas: { revenue: '+14%', cac: '-28%', cvr: '+18%', retention: '+42%' },
              },
            },
            {
              label: 'Community platform — brand-owned community app or WhatsApp group',
              consequence: {
                title: 'Community engaged — purchase conversion weak short-term',
                description: '3,800 customers join. Daily active rate 34%. But community-to-purchase conversion in 90 days is 12% — below 25% target. Strong long-term LTV signal but low 90-day ROI.',
                kpiDeltas: { revenue: '+4%', cac: '-6%', cvr: '+8%', retention: '+28%' },
              },
            },
            {
              label: 'Retail wholesale — stock in ASOS, Cult Beauty, or Boots',
              consequence: {
                title: 'Retail diversification — new channel dependency created',
                description: 'Boots trial listing drives £180k GMV in 90 days. TikTok dependency reduces from 78% to 69%. But Boots margin is 52% lower than DTC and wholesale terms add complexity. A new dependency has been created.',
                kpiDeltas: { revenue: '+11%', cac: '+6%', cvr: '+4%', retention: '-2%' },
              },
            },
          ],
        },
      ],
    },
  },
};
