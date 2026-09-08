'use client';

import React from 'react';
import { NetworkInfo, MeshNode } from '@/types';
import { Radio, AlertOctagon, Truck, CheckCircle2, BatteryCharging, Zap } from 'lucide-react';

interface StatsCardsProps {
  network?: NetworkInfo;
  nodes: MeshNode[];
  onFilterChange: (status: string) => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  network,
  nodes,
  onFilterChange,
  activeFilter
}) => {
  const totalNodes = network?.total_nodes ?? nodes.length;
  const activeNodes = network?.active_nodes ?? nodes.filter(n => n.status !== 'OFFLINE').length;
  const pendingCount = network?.pending_sos_count ?? 0;
  const dispatchedCount = network?.dispatched_count ?? 0;
  const resolvedCount = network?.resolved_count ?? 0;

  // Average battery of online nodes
  const onlineNodes = nodes.filter(n => n.status !== 'OFFLINE');
  const avgBattery = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + n.battery_percentage, 0) / onlineNodes.length)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-5">
      
      {/* 1. Total & Active Nodes */}
      <div 
        onClick={() => onFilterChange('ALL')}
        className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 border transition-all duration-200 ${
          activeFilter === 'ALL'
            ? 'bg-gradient-to-br from-cyan-950/70 to-slate-900 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
            : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            LoRa Nodes
          </span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {totalNodes}
          </span>
          <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            {activeNodes} Online
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Mesh Coverage</span>
          <span className="text-cyan-400 font-bold">{Math.round((activeNodes / (totalNodes || 1)) * 100)}%</span>
        </div>
      </div>

      {/* 2. Pending SOS (Critical Alert - "Dispatch Hoise Kina: NO") */}
      <div 
        onClick={() => onFilterChange('PENDING')}
        className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 border transition-all duration-200 ${
          activeFilter === 'PENDING'
            ? 'bg-gradient-to-br from-red-950/80 to-slate-900 border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
            : 'bg-red-950/20 hover:bg-red-950/40 border-red-900/40 hover:border-red-600/50'
        }`}
      >
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] font-bold text-white items-center justify-center">!</span>
          </span>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase flex items-center gap-1">
              Pending SOS
            </span>
            <span className="text-[10px] text-red-300/80 font-medium">অপেক্ষমান সাহায্যের আবেদন</span>
          </div>
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-red-400">
            {pendingCount}
          </span>
          <span className="text-xs text-red-400/90 font-mono">
            {pendingCount === 1 ? 'Rescue Needed' : 'Rescues Needed'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-red-300/70 font-mono flex items-center justify-between">
          <span>Action Status:</span>
          <span className="text-red-400 font-bold uppercase">Awaiting Dispatch</span>
        </div>
      </div>

      {/* 3. Dispatched Units ("Dispatch Hoise Kina: YES / IN PROGRESS") */}
      <div 
        onClick={() => onFilterChange('DISPATCHED')}
        className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 border transition-all duration-200 ${
          activeFilter === 'DISPATCHED'
            ? 'bg-gradient-to-br from-amber-950/70 to-slate-900 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            : 'bg-amber-950/15 hover:bg-amber-950/30 border-amber-900/30 hover:border-amber-600/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
              Dispatched
            </span>
            <span className="text-[10px] text-amber-300/80 font-medium">উদ্ধারকারী দল প্রেরিত</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-400">
            {dispatchedCount}
          </span>
          <span className="text-xs text-amber-400/90 font-mono">Active Missions</span>
        </div>
        <div className="mt-2 text-[11px] text-amber-300/70 font-mono flex items-center justify-between">
          <span>Status:</span>
          <span className="text-amber-400 font-bold">En Route / Rescuing</span>
        </div>
      </div>

      {/* 4. Resolved / Rescued */}
      <div 
        onClick={() => onFilterChange('RESOLVED')}
        className={`cursor-pointer group relative overflow-hidden rounded-xl p-4 border transition-all duration-200 ${
          activeFilter === 'RESOLVED'
            ? 'bg-gradient-to-br from-emerald-950/70 to-slate-900 border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-emerald-950/15 hover:bg-emerald-950/30 border-emerald-900/30 hover:border-emerald-600/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              Resolved
            </span>
            <span className="text-[10px] text-emerald-300/80 font-medium">উদ্ধার সম্পন্ন</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
            {resolvedCount}
          </span>
          <span className="text-xs text-emerald-400/90 font-mono">Saved / Closed</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-300/70 font-mono flex items-center justify-between">
          <span>Success Rate:</span>
          <span className="text-emerald-400 font-bold">
            {dispatchedCount + resolvedCount > 0 ? Math.round((resolvedCount / (dispatchedCount + resolvedCount)) * 100) : 100}%
          </span>
        </div>
      </div>

      {/* 5. Mesh Battery & RF Telemetry */}
      <div className="col-span-2 sm:col-span-1 xl:col-span-1 rounded-xl p-4 bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
            Mesh Power
          </span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BatteryCharging className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            avgBattery > 50 ? 'text-emerald-400' : avgBattery > 25 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {avgBattery}%
          </span>
          <span className="text-xs text-slate-400 font-mono">Avg Battery</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>Modulation:</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            LoRa {network?.frequency ? network.frequency.split(' ')[0] : '433MHz'}
          </span>
        </div>
      </div>

    </div>
  );
};
