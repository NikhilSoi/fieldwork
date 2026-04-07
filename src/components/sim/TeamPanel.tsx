'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Question } from '@/lib/decisions';

const MEMBER_COLORS = [
  '#378ADD', '#1D9E75', '#D85A30', '#7F77DD',
  '#EC4899', '#F59E0B', '#06B6D4', '#84CC16',
];

interface TeamPanelProps {
  teamId: string;
  sessionId: string;
  round: string;
  roundIdx: number;
  totalRounds: number;
  roundLabels: string[];
  members: { id: string; name: string }[];
  teamSize: number;
  activeMemberIdx: number;
  onMemberSwitch: (idx: number) => void;
  questions: Question[];
  onAdvanceRound: () => void;
  sessionCode: string;
}

type VoteMap = Record<string, number>;

export default function TeamPanel({
  teamId,
  sessionId,
  round,
  roundIdx,
  totalRounds,
  roundLabels,
  members,
  teamSize,
  activeMemberIdx,
  onMemberSwitch,
  questions,
  onAdvanceRound,
  sessionCode,
}: TeamPanelProps) {
  const [votes, setVotes] = useState<VoteMap>({});
  const [locked, setLocked] = useState(false);
  const [locking, setLocking] = useState(false);
  const [finalChoices, setFinalChoices] = useState<Record<number, number>>({});
  const [showMisalignModal, setShowMisalignModal] = useState(false);
  const [teamChecked, setTeamChecked] = useState(false);

  const effectiveMembers = (() => {
    if (members.length > 0) return members;
    return Array.from({ length: teamSize }, (_, i) => ({
      id: `placeholder-${i}`,
      name: `Member ${i + 1}`,
    }));
  })();

  const voteKey = (qIdx: number, mIdx: number) => `${qIdx}-${mIdx}`;

  const loadVotes = useCallback(async () => {
    const { data } = await supabase
      .from('votes')
      .select('question_idx, member_idx, option_idx')
      .eq('team_id', teamId)
      .eq('session_id', sessionId)
      .eq('round', round);

    if (data) {
      const map: VoteMap = {};
      data.forEach((v) => {
        map[voteKey(v.question_idx, v.member_idx)] = v.option_idx;
      });
      setVotes(map);
    }
  }, [teamId, sessionId, round]);

  const checkLocked = useCallback(async () => {
    const { data } = await supabase
      .from('decisions')
      .select('final_votes')
      .eq('team_id', teamId)
      .eq('session_id', sessionId)
      .eq('round', round)
      .maybeSingle();

    if (data) {
      setLocked(true);
      setFinalChoices(data.final_votes ?? {});
    } else {
      setLocked(false);
      setFinalChoices({});
    }
  }, [teamId, sessionId, round]);

  useEffect(() => {
    loadVotes();
    checkLocked();
  }, [loadVotes, checkLocked]);

  useEffect(() => {
    const channel = supabase
      .channel(`votes-${teamId}-${round}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          // Re-fetch all votes for this team/round instead of parsing
          // the payload — avoids replica-identity issues where payload.new
          // may not include non-PK columns like team_id.
          loadVotes();
          setTeamChecked(false);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId, sessionId, round, loadVotes]);

  const handleVote = async (questionIdx: number, optionIdx: number) => {
    if (locked) return;
    const key = voteKey(questionIdx, activeMemberIdx);
    setVotes((prev) => ({ ...prev, [key]: optionIdx }));
    setTeamChecked(false);

    await supabase.from('votes').upsert(
      {
        team_id: teamId,
        session_id: sessionId,
        round,
        question_idx: questionIdx,
        member_idx: activeMemberIdx,
        option_idx: optionIdx,
      },
      { onConflict: 'team_id,round,question_idx,member_idx' }
    );
  };

  const memberHasVotedAll = (mIdx: number) =>
    questions.every((_, qIdx) => votes[voteKey(qIdx, mIdx)] !== undefined);

  const activeMemberDone = memberHasVotedAll(activeMemberIdx);

  const membersVotedCount = effectiveMembers.filter((_, mIdx) =>
    questions.some((_, qIdx) => votes[voteKey(qIdx, mIdx)] !== undefined)
  ).length;

  // Build per-question vote tallies + majority
  const computeChoices = () => {
    const choices: Record<number, number> = {};
    questions.forEach((_, qIdx) => {
      const tally: Record<number, number> = {};
      effectiveMembers.forEach((_, mIdx) => {
        const opt = votes[voteKey(qIdx, mIdx)];
        if (opt !== undefined) {
          tally[opt] = (tally[opt] || 0) + 1;
        }
      });
      let maxCount = 0;
      let majorityOption = 0;
      Object.entries(tally).forEach(([opt, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityOption = Number(opt);
        }
      });
      choices[qIdx] = majorityOption;
    });
    return choices;
  };

  // Check if there is a split on any question among voted members
  const detectSplits = () => {
    let totalVoters = 0;
    effectiveMembers.forEach((_, mIdx) => {
      if (questions.some((_, qIdx) => votes[voteKey(qIdx, mIdx)] !== undefined)) {
        totalVoters++;
      }
    });
    // Skip modal if 0 or 1 voter
    if (totalVoters <= 1) return false;

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const seen = new Set<number>();
      effectiveMembers.forEach((_, mIdx) => {
        const opt = votes[voteKey(qIdx, mIdx)];
        if (opt !== undefined) seen.add(opt);
      });
      if (seen.size > 1) return true;
    }
    return false;
  };

  const commitDecision = async () => {
    setLocking(true);
    const choices = computeChoices();
    await supabase.from('decisions').insert({
      team_id: teamId,
      session_id: sessionId,
      round,
      result: 'completed',
      final_votes: choices,
      score_earned: 0,
    });
    setLocked(true);
    setFinalChoices(choices);
    setLocking(false);
    setShowMisalignModal(false);
  };

  const handleLock = async () => {
    if (!activeMemberDone || locked) return;
    if (detectSplits()) {
      setShowMisalignModal(true);
      return;
    }
    await commitDecision();
  };

  const getVotePips = (qIdx: number, optIdx: number) => {
    return effectiveMembers
      .map((_, mIdx) => {
        const v = votes[voteKey(qIdx, mIdx)];
        return v === optIdx ? mIdx : -1;
      })
      .filter((idx) => idx !== -1);
  };

  const isLastRound = roundIdx >= totalRounds - 1;

  // ─── LOCKED: show consequence panel ───
  if (locked) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <p className="text-xs text-[#718096] uppercase tracking-wider font-medium">
          Decision locked — here is what happened
        </p>

        {questions.map((q, qIdx) => {
          const chosenIdx = finalChoices[qIdx] ?? 0;
          const chosen = q.options[chosenIdx];
          if (!chosen) return null;
          const cons = chosen.consequence;

          return (
            <div key={qIdx} className="rounded-lg border border-[#D1D9D4] bg-[#F4F7F5] p-4">
              <p className="text-xs text-[#718096] mb-1">Q{qIdx + 1}. {q.question}</p>
              <p className="text-sm font-medium text-[#0B1F35] mb-2">
                Your team chose: {chosen.label}
              </p>

              <div className="rounded-lg bg-white border border-[#D1D9D4] p-3">
                <p className="text-sm font-semibold text-[#0B1F35] mb-1">{cons.title}</p>
                <p className="text-sm text-[#4A5568] mb-3">{cons.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(cons.kpiDeltas).map(([key, delta]) => {
                    const isPositive = delta.startsWith('+') && !delta.includes('+0');
                    const isNegative = delta.startsWith('-');
                    // For CAC/churn/cps: negative is good
                    const lowerIsBetter = ['cac', 'churn', 'cps', 'timeToHire'].includes(key);
                    const isGood = lowerIsBetter ? isNegative : isPositive;
                    return (
                      <span
                        key={key}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isGood
                            ? 'bg-[#E8F5F1] text-[#3A9E82]'
                            : isNegative || isPositive
                            ? 'bg-[#E53E3E]/5 text-[#E53E3E]'
                            : 'bg-[#EEF2EF] text-[#718096]'
                        }`}
                      >
                        {key} {delta}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {isLastRound ? (
          <a
            href={`/debrief/${sessionCode}`}
            className="w-full py-3 rounded-lg text-sm font-semibold text-center bg-[#0B1F35] hover:bg-[#0B1F35]/90 text-white transition-all block"
          >
            View debrief &rarr;
          </a>
        ) : (
          <button
            onClick={onAdvanceRound}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-[#3A9E82] hover:bg-[#2D8A6E] text-white transition-all cursor-pointer"
          >
            Continue to {roundLabels[roundIdx + 1]} &rarr;
          </button>
        )}
      </div>
    );
  }

  // ─── VOTING: show questions ───
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="flex flex-wrap gap-2">
          {effectiveMembers.map((m, idx) => {
            const done = memberHasVotedAll(idx);
            const isActive = activeMemberIdx === idx;
            return (
              <button
                key={m.id}
                onClick={() => onMemberSwitch(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? 'text-[#0B1F35] ring-2'
                    : 'text-[#718096] hover:text-[#0B1F35] bg-[#EEF2EF]'
                }`}
                style={{
                  backgroundColor: isActive ? MEMBER_COLORS[idx % MEMBER_COLORS.length] + '20' : undefined,
                  boxShadow: isActive ? `0 0 0 2px ${MEMBER_COLORS[idx % MEMBER_COLORS.length]}` : undefined,
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: MEMBER_COLORS[idx % MEMBER_COLORS.length] }}
                />
                {m.name}
                {done && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-0.5">
                    <circle cx="7" cy="7" r="7" fill="#3A9E82" />
                    <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#718096] mt-2">
          {membersVotedCount} of {effectiveMembers.length} members have voted
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-[#F4F7F5] rounded-lg border border-[#D1D9D4] p-4">
            <div className="text-sm font-medium text-[#0B1F35] mb-3">
              <span className="text-[#718096] mr-2">Q{qIdx + 1}.</span>
              {q.question}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, optIdx) => {
                const pips = getVotePips(qIdx, optIdx);
                const myVote = votes[voteKey(qIdx, activeMemberIdx)];
                const isSelected = myVote === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleVote(qIdx, optIdx)}
                    disabled={locked}
                    className={`flex items-center justify-between text-left px-4 py-3 rounded-lg text-sm transition-all cursor-pointer hover:bg-[#E8F5F1] ${
                      isSelected
                        ? 'bg-white border-2 border-[#3A9E82] text-[#0B1F35]'
                        : 'bg-white border border-[#D1D9D4] text-[#4A5568]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="flex gap-1 ml-3 shrink-0">
                      {pips.map((mIdx) => (
                        <span
                          key={mIdx}
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: MEMBER_COLORS[mIdx % MEMBER_COLORS.length] }}
                          title={effectiveMembers[mIdx]?.name}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Check with team / Lock in decision ─── */}
      {!teamChecked ? (
        <button
          onClick={async () => { await loadVotes(); setTeamChecked(true); }}
          disabled={!activeMemberDone}
          className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
            activeMemberDone
              ? 'bg-[#0B1F35] hover:bg-[#0B1F35]/90 text-white cursor-pointer'
              : 'bg-[#EEF2EF] text-[#718096] cursor-not-allowed'
          }`}
        >
          Check with team
        </button>
      ) : (
        <div className="rounded-lg border border-[#D1D9D4] bg-[#F4F7F5] p-4 flex flex-col gap-3">
          {/* Inline alignment summary */}
          {(() => {
            const hasSplit = detectSplits();
            return (
              <>
                <div className="flex flex-col gap-3">
                  {questions.map((q, qIdx) => {
                    const groups: Record<number, number[]> = {};
                    const notVoted: number[] = [];
                    effectiveMembers.forEach((_, mIdx) => {
                      const opt = votes[voteKey(qIdx, mIdx)];
                      if (opt === undefined) {
                        notVoted.push(mIdx);
                      } else {
                        if (!groups[opt]) groups[opt] = [];
                        groups[opt].push(mIdx);
                      }
                    });
                    const uniqueChoices = Object.keys(groups);
                    const isSplit = uniqueChoices.length > 1;
                    const votedAligned = uniqueChoices.length === 1;

                    return (
                      <div key={qIdx} className="text-sm">
                        <p className="font-medium text-[#0F1C2E] mb-1">
                          Q{qIdx + 1}. {q.question}
                        </p>
                        {votedAligned && (
                          <p className="text-[#3A9E82] flex items-center gap-1.5">
                            <span>&#10003;</span> Aligned on: {q.options[Number(uniqueChoices[0])]?.label}
                          </p>
                        )}
                        {isSplit && (
                          <div className="flex flex-col gap-0.5 ml-1">
                            {Object.entries(groups).map(([optStr, memberIdxs]) => (
                              <p key={optStr} className="text-[#4A5568]">
                                <span className="font-medium">
                                  {memberIdxs.map((mIdx) => effectiveMembers[mIdx]?.name).join(', ')}
                                </span>
                                {' \u2192 '}
                                {q.options[Number(optStr)]?.label}
                              </p>
                            ))}
                          </div>
                        )}
                        {notVoted.length > 0 && (
                          <div className="flex flex-col gap-0.5 ml-1 mt-0.5">
                            {notVoted.map((mIdx) => (
                              <p key={mIdx} className="text-[#A0AEC0] italic text-xs">
                                {effectiveMembers[mIdx]?.name} has not voted yet
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {hasSplit && (
                  <p className="text-sm text-[#E53E3E] font-medium">
                    Your team is not aligned. Check with each team member before committing.
                  </p>
                )}

                {!hasSplit && (
                  <p className="text-sm text-[#3A9E82] font-medium flex items-center gap-1.5">
                    <span>&#10003;</span> Your team is aligned.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setTeamChecked(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-[#D1D9D4] text-[#0F1C2E] hover:bg-white transition-all cursor-pointer"
                  >
                    Go back
                  </button>
                  <button
                    onClick={handleLock}
                    disabled={locking}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#3A9E82] hover:bg-[#2D8A6E] text-white transition-all cursor-pointer"
                  >
                    {locking ? 'Locking...' : 'Lock in decision \u2192'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ─── Misalignment modal (shown when locking with split) ─── */}
      {showMisalignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-[#0F1C2E] mb-4">Your team is not aligned</h3>

            <div className="flex flex-col gap-4 mb-5">
              {questions.map((q, qIdx) => {
                const groups: Record<number, number[]> = {};
                const notVoted: number[] = [];
                effectiveMembers.forEach((_, mIdx) => {
                  const opt = votes[voteKey(qIdx, mIdx)];
                  if (opt === undefined) {
                    notVoted.push(mIdx);
                  } else {
                    if (!groups[opt]) groups[opt] = [];
                    groups[opt].push(mIdx);
                  }
                });
                const uniqueChoices = Object.keys(groups);
                const isSplit = uniqueChoices.length > 1;
                const votedAligned = uniqueChoices.length === 1;

                return (
                  <div key={qIdx} className="text-sm">
                    <p className="font-medium text-[#0F1C2E] mb-1.5">
                      &ldquo;{q.question}&rdquo;
                    </p>
                    {votedAligned && (
                      <p className="text-[#3A9E82] flex items-center gap-1.5">
                        <span>&#10003;</span> All voted members aligned on: {q.options[Number(uniqueChoices[0])]?.label}
                      </p>
                    )}
                    {isSplit && (
                      <div className="flex flex-col gap-1 ml-1">
                        {Object.entries(groups).map(([optStr, memberIdxs]) => (
                          <p key={optStr} className="text-[#4A5568]">
                            <span className="font-medium">
                              {memberIdxs.map((mIdx) => effectiveMembers[mIdx]?.name).join(', ')}
                            </span>
                            {' \u2192 '}
                            {q.options[Number(optStr)]?.label}
                          </p>
                        ))}
                      </div>
                    )}
                    {notVoted.length > 0 && (
                      <div className={`flex flex-col gap-0.5 ${isSplit ? 'ml-1 mt-1' : 'ml-1 mt-0.5'}`}>
                        {notVoted.map((mIdx) => (
                          <p key={mIdx} className="text-[#A0AEC0] italic">
                            {effectiveMembers[mIdx]?.name} has not voted yet
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-[#718096] mb-5">
              Teams that discuss disagreements before committing tend to make more data-supported decisions.
              Nova can help &mdash; ask her to challenge both sides.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowMisalignModal(false); setTeamChecked(false); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-[#D1D9D4] text-[#0F1C2E] hover:bg-[#F4F7F5] transition-all cursor-pointer"
              >
                Go back and discuss
              </button>
              <button
                onClick={commitDecision}
                disabled={locking}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#3A9E82] hover:bg-[#2D8A6E] text-white transition-all cursor-pointer"
              >
                {locking ? 'Locking...' : 'Lock in anyway \u2192'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
