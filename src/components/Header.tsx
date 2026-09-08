'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Volume2, VolumeX, RefreshCw, Settings, AlertTriangle, Send, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { NetworkInfo } from '@/types';

interface HeaderProps {
  network: NetworkInfo | undefined;
  latencyMs: number;
  loading: boolean;
  soundEnabled: boolean;
  isPolling: boolean;
  apiUrl: string;
  onToggleSound: () => void;
  onRefresh: () => void;
  onOpenApiModal: () => void;
  onOpenSosModal: () => void;
  onOpenBroadcastModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  network,
  latencyMs,
  loading,
  soundEnabled,
  isPolling,
  apiUrl,
  onToggleSound,
  onRefresh,
  onOpenApiModal,
  onOpenSosModal,
  onOpenBroadcastModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC+' + (-now.getTimezoneOffset() / 60));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isInternal = apiUrl.startsWith('/') || apiUrl.includes('localhost');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-950/60 bg-[#070b14]/90 backdrop-blur-md px-4 py-2.5 transition-all">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Branding & Core LoRa Frequency Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-wider text-slate-100 uppercase">
                  LoRa<span className="text-cyan-400">Mesh</span> EOC
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  DISASTER RELIEF OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>{network?.network_name || 'LoRa-Mesh-Emergency'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-semibold">{network?.frequency || '433.175 MHz'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">SF{network?.spreading_factor || 11}</span>
              </p>
            </div>
          </div>

          {/* Mobile Time */}
          <div className="text-right md:hidden font-mono text-xs text-slate-400">
            {currentTime}
          </div>
        </div>

        {/* Center: Tactical Mesh Health telemetry badges */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">GATEWAY:</span>
            <span className="text-emerald-400 font-bold">{network?.gateway_id || 'GW-01'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">HEALTH:</span>
            <span className="text-emerald-300 font-semibold uppercase">{network?.mesh_health || 'OPTIMAL'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">API:</span>
            <span className={`px-1.5 py-0.2 rounded text-[11px] ${isInternal ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'}`}>
              {isInternal ? 'Built-in Simulation' : 'Remote Gateway'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-slate-400">
            LATENCY: <span className="text-cyan-400 font-bold">{latencyMs}ms</span>
          </div>
        </div>

        {/* Right: Actions, SOS Simulation, Sound, Config */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Simulate SOS Emergency (Great for demonstrations & verification) */}
          <button
            onClick={onOpenSosModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 transition shadow-[0_0_12px_rgba(239,68,68,0.2)] active:scale-95"
            title="Simulate incoming victim SOS packet"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="hidden sm:inline">Simulate</span> SOS
          </button>

          {/* Broadcast Downlink */}
          <button
            onClick={onOpenBroadcastModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            title="Broadcast message to all LoRa nodes"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Mesh</span> Broadcast
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border text-xs transition active:scale-95 ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Emergency Siren Audio Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition active:scale-95"
            title="Manual Poll / Refresh Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* API Link Config Modal */}
          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 transition active:scale-95"
            title="Configure API Endpoint URL & Polling"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API</span> Config
          </button>

          {/* Clock Display (Desktop) */}
          <div className="hidden md:flex flex-col text-right font-mono text-[11px] text-slate-400 pl-2 border-l border-slate-800">
            <span className="text-slate-200 font-bold">{currentTime.split(' ')[0]}</span>
            <span className="text-[10px] text-cyan-500">{currentTime.split(' ')[1]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
