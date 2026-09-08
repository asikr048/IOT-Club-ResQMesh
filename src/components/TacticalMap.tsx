'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MeshNode, HelpRequest } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';

const TacticalMapInner = dynamic(
  () => import('./TacticalMapInner').then(mod => mod.TacticalMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
        <span className="font-mono text-xs tracking-wider uppercase">Loading Tactical Mesh Cartography...</span>
      </div>
    )
  }
);

interface TacticalMapProps {
  nodes: MeshNode[];
  helpRequests: HelpRequest[];
  selectedNode: MeshNode | null;
  selectedRequest: HelpRequest | null;
  onSelectNode: (node: MeshNode | null) => void;
  onSelectRequest: (request: HelpRequest | null) => void;
  onOpenDispatchModal: (request: HelpRequest) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = (props) => {
  return <TacticalMapInner {...props} />;
};
