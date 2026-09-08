'use client';

import React, { useState } from 'react';
import { Terminal, Send, ShieldAlert, Cpu, Radio, Filter } from 'lucide-react';
import { SystemLog, MeshPacketLog } from '@/types';

interface BroadcastTerminalProps {
  logs: SystemLog[];
  packets?: MeshPacketLog[];
  onSendBroadcast: (message: string, channel: string) => void;
}

export const BroadcastTerminal: React.FC<BroadcastTerminalProps> = ({
  logs,
  packets = [],
  onSendBroadcast,
}) => {
  const [activeTab, setActiveTab] = useState<'PACKETS' | 'SYSTEM_LOGS'>('PACKETS');
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [channel, setChannel] = useState<string>('EMERGENCY_CH1');

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onSendBroadcast(broadcastText.trim(), channel);
    setBroadcastText('');
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden flex flex-col h-full">
      
      {/* Terminal Header & Tab Switcher */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Tactical Mesh Terminal & Broadcast
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live RF Packet Stream & Emergency Downlink
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('PACKETS')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'PACKETS'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RF Packets ({packets.length})
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM_LOGS')}
            className={`px-3 py-1 rounded-md transition ${
              activeTab === 'SYSTEM_LOGS'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            System Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Terminal Feed Display */}
      <div className="flex-1 overflow-y-auto p-3 bg-black/60 font-mono text-xs space-y-2 max-h-[320px] min-h-[220px]">
        {activeTab === 'PACKETS' ? (
          packets.length === 0 ? (
            <div className="py-8 text-center text-slate-600">No mesh packets captured yet.</div>
          ) : (
            packets.map(pkt => (
              <div
                key={pkt.id}
                className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-slate-300 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{pkt.id}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                      pkt.type === 'SOS' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      pkt.type === 'BROADCAST' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {pkt.type}
                    </span>
                    <span>{pkt.source} → {pkt.destination}</span>
                  </div>
                  <span>{new Date(pkt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-emerald-300 break-all">
                  &gt; {pkt.payload}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                  <span>Hops: {pkt.hops}</span>
                  <span>RSSI: {pkt.rssi} dBm</span>
                  <span>SNR: {pkt.snr} dB</span>
                </div>
              </div>
            ))
          )
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-xs flex items-start gap-2"
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                log.level === 'ALERT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                'bg-slate-800 text-slate-400'
              }`}>
                {log.level}
              </span>
              <div className="flex-1">
                <span className="text-slate-200">{log.text}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Message Bar */}
      <form
        onSubmit={handleBroadcastSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-2"
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="EMERGENCY_CH1">EMERGENCY_CH1 (All)</option>
            <option value="RESCUE_UNITS_ONLY">RESCUE_UNITS_ONLY</option>
            <option value="CIVIL_SHELTERS">CIVIL_SHELTERS</option>
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Transmit emergency broadcast across LoRa mesh downlinks..."
            className="w-full pl-3 pr-24 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!broadcastText.trim()}
            className="absolute right-1 top-1 bottom-1 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-xs font-mono font-bold transition flex items-center gap-1"
          >
            <Send className="w-3 h-3" /> Broadcast
          </button>
        </div>
      </form>

    </div>
  );
};
