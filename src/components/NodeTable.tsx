'use client';

import React, { useState } from 'react';
import { MeshNode, NodeRole } from '@/types';
import { Radio, Battery, Signal, ArrowUpRight, Search, Zap, Layers, MapPin } from 'lucide-react';

interface NodeTableProps {
  nodes: MeshNode[];
  selectedNode: MeshNode | null;
  onSelectNode: (node: MeshNode) => void;
}

export const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredNodes = nodes.filter(node => {
    if (roleFilter !== 'ALL' && node.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        node.node_id.toLowerCase().includes(q) ||
        node.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSignalStrengthColor = (rssi: number) => {
    if (rssi >= -80) return 'text-emerald-400';
    if (rssi >= -105) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBatteryColor = (bat: number) => {
    if (bat >= 50) return 'bg-emerald-500';
    if (bat >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRoleBadge = (role: NodeRole) => {
    switch (role) {
      case 'GATEWAY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">GATEWAY</span>;
      case 'RELAY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">RELAY</span>;
      case 'RESCUE_TEAM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">RESCUE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-700/50 text-slate-300">CLIENT</span>;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden flex flex-col">
      
      {/* Table Controls */}
      <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              LoRa Mesh Node Telemetry
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {nodes.length} Nodes Registered in Mesh Topology
            </p>
          </div>
        </div>

        {/* Filter by Role & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search node ID / name..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
            {['ALL', 'GATEWAY', 'RELAY', 'CLIENT_NODE', 'RESCUE_TEAM'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-md transition ${
                  roleFilter === r
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'CLIENT_NODE' ? 'CLIENTS' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Node</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Hops</th>
              <th className="py-2.5 px-3">Signal (RSSI / SNR)</th>
              <th className="py-2.5 px-3">Battery</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.node_id === node.node_id;
              const isOffline = node.status === 'OFFLINE';

              return (
                <tr
                  key={node.node_id}
                  onClick={() => onSelectNode(node)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/40 text-cyan-200'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  {/* Node ID & Name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-cyan-400">{node.node_id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans truncate max-w-[170px]">
                      {node.name}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-3">
                    {getRoleBadge(node.role)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOffline
                        ? 'bg-slate-800 text-slate-500'
                        : node.status === 'SOS'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOffline ? 'bg-slate-500' : node.status === 'SOS' ? 'bg-red-500' : 'bg-emerald-400'
                      }`} />
                      {node.status}
                    </span>
                  </td>

                  {/* Hops */}
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-bold">
                      {node.hop_count} {node.hop_count === 1 ? 'hop' : 'hops'}
                    </span>
                  </td>

                  {/* Signal */}
                  <td className="py-3 px-3">
                    <div className={`font-bold ${getSignalStrengthColor(node.rssi)}`}>
                      {node.rssi} dBm
                    </div>
                    <div className="text-[10px] text-slate-500">
                      SNR: {node.snr} dB
                    </div>
                  </td>

                  {/* Battery */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${getBatteryColor(node.battery_percentage)}`}
                          style={{ width: `${node.battery_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {node.battery_percentage}%
                      </span>
                    </div>
                    {node.battery_voltage && (
                      <div className="text-[10px] text-slate-500">
                        {node.battery_voltage}V
                      </div>
                    )}
                  </td>

                  {/* GPS Coords */}
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    <div>{node.latitude.toFixed(4)}°N</div>
                    <div>{node.longitude.toFixed(4)}°E</div>
                  </td>

                  {/* Locate on Map Action */}
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode(node);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 border border-slate-700 text-slate-300 text-[11px] transition inline-flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      Locate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
