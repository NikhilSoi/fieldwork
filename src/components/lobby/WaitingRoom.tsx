'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface WaitingRoomProps {
  session: any;
  teams: any[];
  onStart: () => void;
}

export default function WaitingRoom({ session, teams, onStart }: WaitingRoomProps) {
  const [members, setMembers] = useState<Record<string, any[]>>({});
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('session_id', session.id);

    if (data) {
      const grouped: Record<string, any[]> = {};
      for (const m of data) {
        const tid = m.team_id;
        if (!grouped[tid]) grouped[tid] = [];
        grouped[tid].push(m);
      }
      setMembers(grouped);
    }
  }, [session.id]);

  useEffect(() => {
    fetchMembers();

    const channel = supabase
      .channel(`lobby-members-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'members' },
        () => { fetchMembers(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, fetchMembers]);

  const copyCode = () => {
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allTeamsHaveMembers = teams.every(
    (team) => (members[team.id] || []).length > 0
  );

  const handleStart = async () => {
    setStarting(true);
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'active' })
      .eq('id', session.id);

    if (!error) {
      onStart();
    }
    setStarting(false);
  };

  const totalMembers = Object.values(members).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Session Code */}
      <div className="text-center mb-8">
        <p className="text-sm text-white/50 mb-2">Session Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-bold font-mono tracking-[0.3em] text-white">
            {session.code}
          </span>
          <button
            onClick={copyCode}
            className="rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-white/40 mt-2">
          {totalMembers} student{totalMembers !== 1 ? 's' : ''} joined
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {teams.length === 0 && (
          <p className="col-span-2 text-center text-white/40 py-8">
            No teams created yet.
          </p>
        )}
        {teams.map((team) => {
          const teamMembers = members[team.id] || [];
          return (
            <div
              key={team.id}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px', borderLeftColor: team.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-semibold text-sm text-white">{team.name}</span>
                </div>
                <span className="text-xs text-white/40">
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                </span>
              </div>

              {teamMembers.length === 0 ? (
                <p className="text-xs text-white/30 italic">Waiting for students...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map((m) => (
                    <span
                      key={m.id}
                      className="text-xs bg-white/10 text-white rounded-md px-2 py-1 animate-fade-in"
                    >
                      {m.display_name || m.name || 'Student'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={!allTeamsHaveMembers || starting}
          className="rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-10 py-3 text-sm transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
        >
          {starting ? 'Starting...' : 'Start Simulation'}
        </button>
        {!allTeamsHaveMembers && (
          <p className="text-xs text-white/40 mt-2">
            Each team needs at least 1 member to start
          </p>
        )}
      </div>
    </div>
  );
}
