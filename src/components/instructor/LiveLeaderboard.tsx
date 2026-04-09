'use client';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface Decision {
  team_id: string;
  round: string;
  locked?: boolean;
}

interface LiveLeaderboardProps {
  teams: Team[];
  decisions: Decision[];
}

export default function LiveLeaderboard({ teams, decisions }: LiveLeaderboardProps) {
  const teamProgress = teams
    .map((team) => {
      const teamDecisions = decisions.filter((d) => d.team_id === team.id);
      const roundsCompleted = teamDecisions.length;
      const currentRound =
        teamDecisions.length > 0
          ? teamDecisions[teamDecisions.length - 1].round
          : '--';
      const status = teamDecisions.length >= 3 ? 'Complete' : teamDecisions.length > 0 ? 'In progress' : 'Waiting';

      return {
        ...team,
        roundsCompleted,
        currentRound,
        status,
      };
    })
    .sort((a, b) => b.roundsCompleted - a.roundsCompleted);

  if (teams.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-center text-white/40"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
      >
        No teams yet.
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white/60">Team Progress</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/50 text-xs border-b border-white/[0.06]">
            <th className="text-left px-4 py-2 font-medium">Team</th>
            <th className="text-center px-4 py-2 font-medium">Rounds</th>
            <th className="text-center px-4 py-2 font-medium">Current</th>
            <th className="text-center px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {teamProgress.map((team) => (
            <tr key={team.id} className="border-b border-white/[0.06] last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                  <span className="text-white/60">{team.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center font-mono text-white/60">{team.roundsCompleted}/3</td>
              <td className="px-4 py-3 text-center text-white/40 capitalize">{team.currentRound}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    team.status === 'Complete'
                      ? 'bg-[#3A9E82]/15 text-[#3A9E82]'
                      : team.status === 'In progress'
                      ? 'bg-[#D97706]/10 text-[#D97706]'
                      : 'bg-white/[0.04] text-white/40'
                  }`}
                >
                  {team.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
