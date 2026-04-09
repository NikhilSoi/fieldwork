'use client';

import { useState } from 'react';

interface BroadcastBarProps {
  sessionId: string;
}

export default function BroadcastBar({ sessionId }: BroadcastBarProps) {
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const handleBroadcast = () => {
    if (!message.trim()) return;

    // Future: send via Supabase realtime channel
    // supabase.channel(`session-${sessionId}`).send({ type: 'broadcast', event: 'instructor-message', payload: { message } })

    setToast(`Broadcast sent: "${message.trim()}"`);
    setMessage('');
    setTimeout(() => setToast(null), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBroadcast();
    }
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 rounded-2xl p-2"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px' }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Broadcast a message to all teams..."
          className="flex-1 bg-transparent text-sm px-3 py-1.5 focus:outline-none text-white placeholder-white/30"
        />
        <button
          onClick={handleBroadcast}
          disabled={!message.trim()}
          className="rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 transition-colors flex-shrink-0 hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #3A9E82, #2D8A6E)', boxShadow: '0 4px 16px rgba(58,158,130,0.3)' }}
        >
          Broadcast
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-full mb-2 left-0 right-0 flex justify-center animate-fade-in">
          <span className="bg-[#3A9E82]/20 text-[#3A9E82] text-xs rounded-lg px-4 py-2 border border-[#3A9E82]/20">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
