'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const SCENARIOS = [
  { value: 'dtc', label: 'Direct-to-Consumer' },
  { value: 'saas', label: 'SaaS & Product Growth' },
  { value: 'market', label: 'Marketplace Economics' },
  { value: 'media', label: 'Media & Monetisation' },
  { value: 'ecom', label: 'Future of E-commerce' },
];

const ROUNDS = ['Budget', 'Diagnose', 'RFM'];

const TEAM_NAMES = ['The Pivots', 'Data Drivers', 'Growth Lab', 'Signal & Noise'];
const TEAM_COLORS = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD'];

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface InstructorSetupProps {
  onSessionCreated: (session: any) => void;
}

export default function InstructorSetup({ onSessionCreated }: InstructorSetupProps) {
  const [instructorName, setInstructorName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [scenario, setScenario] = useState('dtc');
  const [teamSize, setTeamSize] = useState(4);
  const [activeRounds, setActiveRounds] = useState<number[]>([0, 1, 2]);
  const [roundDuration, setRoundDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRound = (index: number) => {
    setActiveRounds((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort()
    );
  };

  const handleCreate = async () => {
    if (!instructorName.trim() || !courseName.trim()) {
      setError('Please fill in instructor name and course name.');
      return;
    }
    if (activeRounds.length === 0) {
      setError('Please select at least one round.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const code = generateCode();

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          code,
          scenario,
          active_rounds: activeRounds,
          team_size: teamSize,
          status: 'lobby',
          instructor_name: instructorName.trim(),
          course_name: courseName.trim(),
          round_duration_minutes: roundDuration,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const teams = [];
      for (let i = 0; i < teamSize; i++) {
        teams.push({
          name: TEAM_NAMES[i],
          color: TEAM_COLORS[i],
          session_id: session.id,
        });
      }

      const { error: teamsError } = await supabase.from('teams').insert(teams);
      if (teamsError) throw teamsError;

      onSessionCreated(session);
    } catch (err: any) {
      setError(err.message || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Create a Session</h2>

      <div className="space-y-5">
        {/* Instructor Name */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Instructor Name</label>
          <input
            type="text"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            placeholder="Prof. Smith"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Course Name */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Course Name</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Marketing Analytics 301"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Scenario */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#1a1a1a]">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Team Size */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">
            Number of Teams ({teamSize})
          </label>
          <input
            type="number"
            min={2}
            max={6}
            value={teamSize}
            onChange={(e) => {
              const v = Math.min(6, Math.max(2, parseInt(e.target.value) || 2));
              setTeamSize(v);
            }}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {teamSize > 4 && (
            <p className="text-xs text-white/40 mt-1">
              Teams 5+ will use generated names and colors.
            </p>
          )}
        </div>

        {/* Active Rounds */}
        <div>
          <label className="block text-sm text-white/60 mb-2">Active Rounds</label>
          <div className="flex gap-3">
            {ROUNDS.map((round, i) => (
              <label
                key={round}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                  activeRounds.includes(i)
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={activeRounds.includes(i)}
                  onChange={() => toggleRound(i)}
                  className="sr-only"
                />
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    activeRounds.includes(i)
                      ? 'border-[var(--accent)] bg-[var(--accent)]'
                      : 'border-white/30'
                  }`}
                >
                  {activeRounds.includes(i) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {round}
              </label>
            ))}
          </div>
        </div>

        {/* Time per Round */}
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Time per Round</label>
          <select
            value={roundDuration ?? ''}
            onChange={(e) => setRoundDuration(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
          >
            <option value="" className="bg-[#1a1a1a]">No timer</option>
            <option value="10" className="bg-[#1a1a1a]">10 minutes</option>
            <option value="15" className="bg-[#1a1a1a]">15 minutes</option>
            <option value="20" className="bg-[#1a1a1a]">20 minutes</option>
            <option value="30" className="bg-[#1a1a1a]">30 minutes</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 text-sm transition-colors"
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </div>
  );
}
