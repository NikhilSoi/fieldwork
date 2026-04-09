'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SCENARIO_LABELS: Record<string, string> = {
  dtc: 'Direct-to-Consumer',
  saas: 'SaaS & Product Growth',
  market: 'Marketplace Economics',
  media: 'Media & Monetisation',
  ecom: 'Future of E-commerce',
};

const STATUS_STYLE: Record<string, string> = {
  lobby: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
  active: 'bg-[#3A9E82]/10 text-[#3A9E82] border-[#3A9E82]/20',
  completed: 'bg-white/10 text-white/70 border-white/20',
};

interface SessionRow {
  id: string;
  code: string;
  scenario: string;
  instructor_name: string | null;
  course_name: string | null;
  status: string;
  created_at: string;
  teamCount: number;
  memberCount: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SessionRow | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data: rawSessions } = await supabase
      .from('sessions')
      .select('id, code, scenario, instructor_name, course_name, status, created_at')
      .order('created_at', { ascending: false });

    if (!rawSessions) {
      setLoading(false);
      return;
    }

    const enriched: SessionRow[] = [];
    for (const s of rawSessions) {
      const { count: teamCount } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', s.id);

      const { count: memberCount } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', s.id);

      enriched.push({
        ...s,
        teamCount: teamCount ?? 0,
        memberCount: memberCount ?? 0,
      });
    }

    setSessions(enriched);
    setLoading(false);
  }

  async function handleDeleteSession(session: SessionRow) {
    setDeleting(true);
    await supabase.from('sessions').delete().eq('id', session.id);
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    setConfirmDelete(null);
    setDeleting(false);
  }

  async function handleDeleteTestSessions() {
    setDeleting(true);
    const testSessions = sessions.filter(
      (s) => !s.instructor_name || !s.course_name || s.status === 'lobby'
    );
    const ids = testSessions.map((s) => s.id);
    if (ids.length > 0) {
      await supabase.from('sessions').delete().in('id', ids);
      setSessions((prev) => prev.filter((s) => !ids.includes(s.id)));
    }
    setConfirmDeleteAll(false);
    setDeleting(false);
  }

  const q = search.toLowerCase().trim();
  const filtered = q
    ? sessions.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          (s.instructor_name ?? '').toLowerCase().includes(q) ||
          (s.course_name ?? '').toLowerCase().includes(q)
      )
    : sessions;

  const testSessionCount = sessions.filter(
    (s) => !s.instructor_name || !s.course_name || s.status === 'lobby'
  ).length;

  return (
    <div className="min-h-screen p-6 lg:p-10" style={{ background: 'linear-gradient(135deg, #0B1F35 0%, #0d2a45 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-white/60 hover:text-white text-sm mb-2 inline-block">
              &larr; Home
            </Link>
            <h1 className="font-display text-3xl font-bold text-white">Past Sessions</h1>
            <p className="text-white/40 text-sm mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {testSessionCount > 0 && (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="rounded-xl border border-[#E53E3E]/30 text-[#E53E3E] hover:bg-[#E53E3E]/10 px-4 py-2.5 text-xs font-medium transition-colors"
              >
                Delete {testSessionCount} test session{testSessionCount !== 1 ? 's' : ''}
              </button>
            )}
            <Link
              href="/instructor"
              className="rounded-xl text-white font-semibold px-6 py-2.5 text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
            >
              New Session
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, instructor, or course..."
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3A9E82] transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-pulse-pip text-white/40 text-sm">Loading sessions...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40 text-sm">
              {q ? 'No sessions match your search.' : 'No sessions yet.'}
            </p>
            {!q && (
              <Link
                href="/instructor"
                className="inline-block mt-4 text-[#3A9E82] hover:underline text-sm"
              >
                Create your first session
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const label = SCENARIO_LABELS[s.scenario] ?? s.scenario;
              const date = new Date(s.created_at);
              const dateStr = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
                >
                  {/* Code */}
                  <div className="shrink-0">
                    <span className="text-2xl font-mono font-bold tracking-widest text-white">
                      {s.code}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{label}</span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                          STATUS_STYLE[s.status] ?? 'bg-white/[0.04] text-white/40 border-white/[0.08]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {s.instructor_name && <span>{s.instructor_name}</span>}
                      {s.instructor_name && s.course_name && <span> &middot; </span>}
                      {s.course_name && <span>{s.course_name}</span>}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {dateStr} at {timeStr} &middot; {s.teamCount} team{s.teamCount !== 1 ? 's' : ''} &middot; {s.memberCount} student{s.memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/session/${s.code}`}
                      className="rounded-lg border border-white/[0.12] hover:border-[#3A9E82] text-white/60 hover:text-[#3A9E82] px-4 py-2 text-xs transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      View Session
                    </Link>
                    <Link
                      href={`/debrief/${s.code}`}
                      className="rounded-lg text-white/60 hover:text-[#3A9E82] px-4 py-2 text-xs transition-colors"
                      style={{ background: 'rgba(58,158,130,0.15)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      Debrief
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(s)}
                      className="p-2 rounded-lg text-white/30 hover:text-[#E53E3E] hover:bg-[#E53E3E]/10 transition-colors"
                      title="Delete session"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete single session modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl shadow-xl max-w-md w-full p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Delete session {confirmDelete.code}?
            </h3>
            <p className="text-sm text-white/60 mb-6">
              This will permanently remove all teams, members, votes, and decisions for this session. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.04] transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(confirmDelete)}
                disabled={deleting}
                className="rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all test sessions modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl shadow-xl max-w-md w-full p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Delete {testSessionCount} test session{testSessionCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-white/60 mb-2">
              This will delete all sessions where:
            </p>
            <ul className="text-sm text-white/60 mb-6 list-disc list-inside space-y-1">
              <li>Instructor name is missing</li>
              <li>Course name is missing</li>
              <li>Status is still &ldquo;lobby&rdquo; (never started)</li>
            </ul>
            <p className="text-sm text-[#E53E3E] mb-6">
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                disabled={deleting}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.04] transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTestSessions}
                disabled={deleting}
                className="rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : `Delete ${testSessionCount} session${testSessionCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
