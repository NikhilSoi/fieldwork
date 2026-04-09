import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}
    >
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(11,31,53,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg text-white">Fieldwork</span>
          <div className="flex items-center gap-4">
            <Link href="/sessions" className="text-sm text-white/60 hover:text-white transition-colors">
              Past sessions
            </Link>
            <Link
              href="/join"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Join
            </Link>
            <Link
              href="/instructor"
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)',
                boxShadow: '0 4px 16px rgba(58,158,130,0.3)',
              }}
            >
              Run a session
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-32 lg:py-40"
      >
        {/* Subtle grid background */}
        <div className="bg-grid pointer-events-none absolute inset-0" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center gap-6 text-center animate-fade-in">
          <div>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white">
              Fieldwork
            </h1>
            <p className="mt-2 text-sm font-medium text-white/40">
              by VectorEd
            </p>
          </div>

          <p className="max-w-lg text-xl text-white/60">
            Build the judgment AI can&rsquo;t <em className="text-[#3A9E82] font-semibold not-italic">replace</em>.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/instructor"
              className="rounded-xl px-8 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)',
                boxShadow: '0 4px 16px rgba(58,158,130,0.3)',
              }}
            >
              Run a session&nbsp;&rarr;
            </Link>
            <Link
              href="/join"
              className="rounded-xl px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/[0.08]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Join a session
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <section className="bg-white/[0.03] py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-mono-data text-3xl font-bold text-[#3A9E82]">5</p>
            <p className="text-sm text-white/70 mt-1">Live scenarios</p>
          </div>
          <div>
            <p className="font-mono-data text-3xl font-bold text-[#3A9E82]">6</p>
            <p className="text-sm text-white/70 mt-1">Data dashboards</p>
          </div>
          <div>
            <p className="font-mono-data text-3xl font-bold text-[#3A9E82]">3</p>
            <p className="text-sm text-white/70 mt-1">Decision rounds</p>
          </div>
          <div>
            <p className="font-mono-data text-3xl font-bold text-[#3A9E82]">AI</p>
            <p className="text-sm text-white/70 mt-1">Socratic copilot</p>
          </div>
        </div>
      </section>

      {/* ── Value props ─────────────────────────────────────── */}
      <section
        aria-label="What students experience"
        className="relative mx-auto max-w-5xl px-6 py-24"
      >
        <h2 className="font-display text-2xl font-bold text-center text-white mb-12">
          What students experience
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Scenarios */}
          <div
            className="rounded-2xl p-6 animate-fade-in-scale delay-75 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#3A9E82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="mb-4" aria-hidden="true"
            >
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              4 live scenarios
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Lum&eacute; (DTC) &middot; Flowdesk (SaaS) &middot; Stackd
              (Marketplace) &middot; The Brief (Media) &middot; Spark (E-commerce)
            </p>
          </div>

          {/* Card 2 — Analytics data */}
          <div
            className="rounded-2xl p-6 animate-fade-in-scale delay-200 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#3A9E82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="mb-4" aria-hidden="true"
            >
              <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
              <path d="M7 3v18" /><path d="M17 3v18" />
            </svg>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Real analytics data
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              P&amp;L, funnels, cohorts, RFM segmentation, benchmarks — no toy numbers
            </p>
          </div>

          {/* Card 3 — Nova AI copilot */}
          <div
            className="rounded-2xl p-6 animate-fade-in-scale delay-300 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#3A9E82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="mb-4" aria-hidden="true"
            >
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
              <path d="M18 14l1.18 3.54L23 18.5l-3.82.96L18 23l-1.18-3.54L13 18.5l3.82-.96L18 14z" />
            </svg>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Nova AI copilot
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Socratic challenges that build judgment, not answers students can copy
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        aria-label="Footer"
        className="px-6 py-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-sm text-white/60">Fieldwork by VectorEd</span>
          <span className="text-sm text-white/60">
            Build the judgment AI can&rsquo;t replace.
          </span>
        </div>
      </footer>
    </main>
  );
}
