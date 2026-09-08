'use client';

import React from 'react';
import { MeshNode } from '@/types';
import { GitFork, Radio, ShieldAlert } from 'lucide-react';

interface MeshTopologyGraphProps {
  nodes: MeshNode[];
  selectedNode: MeshNode | null;
  onSelectNode: (node: MeshNode) => void;
}

export const MeshTopologyGraph: React.FC<MeshTopologyGraphProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
}) => {
  // Group nodes by hop count
  const hopsMap = new Map<number, MeshNode[]>();
  nodes.forEach(node => {
    const list = hopsMap.get(node.hop_count) || [];
    list.push(node);
    hopsMap.set(node.hop_count, list);
  });

  const sortedHopLevels = Array.from(hopsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              LoRa Multi-Hop Topology
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Mesh Relay Routing & Signal Pathways
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          Max Hops: {Math.max(...nodes.map(n => n.hop_count), 0)}
        </span>
      </div>

      {/* Hop Layer Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 overflow-x-auto py-2">
        {sortedHopLevels.map(hop => {
          const hopNodes = hopsMap.get(hop) || [];
          return (
            <div
              key={hop}
              className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 min-w-[200px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
                <span className="font-mono text-xs font-bold text-cyan-400 uppercase">
                  {hop === 0 ? 'Tier 0: Root Gateway' : `Tier ${hop}: Hop Level ${hop}`}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {hopNodes.length} {hopNodes.length === 1 ? 'node' : 'nodes'}
                </span>
              </div>

              <div className="space-y-2">
                {hopNodes.map(node => {
                  const isSelected = selectedNode?.node_id === node.node_id;
                  const isOffline = node.status === 'OFFLINE';
                  const isSos = node.status === 'SOS';

                  return (
                    <div
                      key={node.node_id}
                      onClick={() => onSelectNode(node)}
                      className={`cursor-pointer rounded-lg p-2.5 border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : isSos
                          ? 'bg-red-950/30 border-red-500/50 hover:border-red-400'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                          {node.role === 'GATEWAY' && <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                          {isSos && <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-bounce" />}
                          {node.node_id}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isOffline ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-400'
                        }`}>
                          {node.battery_percentage}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate mb-1.5">
                        {node.name}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>RSSI: {node.rssi} dBm</span>
                        {node.parent_node_id && (
                          <span className="text-cyan-500">via {node.parent_node_id}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
