'use client';

import React, { useState } from 'react';
import { X, Send, Radio, AlertTriangle } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBroadcast: (message: string, channel: string) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  onSendBroadcast,
}) => {
  const [message, setMessage] = useState<string>('CIVIL NOTICE: Relief boats active in Muhuri Basin. Please conserve node batteries and stay on high ground.');
  const [channel, setChannel] = useState<string>('EMERGENCY_BROADCAST_ALL');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendBroadcast(message.trim(), channel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-cyan-900/60 bg-slate-900/95 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                LoRa Mesh Emergency Broadcast
              </h3>
              <p className="text-xs font-mono text-cyan-300/80">
                Downlink to all field nodes & shelters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Broadcast Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="EMERGENCY_BROADCAST_ALL">🚨 EMERGENCY_BROADCAST_ALL (Every Node)</option>
              <option value="RESCUE_TEAMS_ONLY">🚤 RESCUE_TEAMS_ONLY (Boats & Teams)</option>
              <option value="FLOOD_SHELTERS">🏫 FLOOD_SHELTERS (Civil Refuge)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Broadcast Message (Max 140 chars for LoRa payload)
            </label>
            <textarea
              rows={3}
              maxLength={140}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
              required
            />
            <div className="text-right text-[10px] font-mono text-slate-500 mt-0.5">
              {message.length} / 140 characters
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Transmit Broadcast
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
