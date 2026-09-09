'use client';

import React from 'react';
import { HelpRequest, DispatchStatus } from '@/types';
import { 
  AlertCircle, 
  Clock, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  ShieldAlert, 
  LifeBuoy, 
  ChevronRight, 
  Radio, 
  Phone,
  Check,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface EmergencyHelpFeedProps {
  requests: HelpRequest[];
  filterStatus: string;
  searchQuery: string;
  selectedRequest: HelpRequest | null;
  onSelectRequest: (request: HelpRequest) => void;
  onOpenDispatchModal: (request: HelpRequest) => void;
  onQuickDispatch: (requestId: string) => void;
}

const getAidIcon = (name: string) => {
  const s = name.toLowerCase();
  if (s.includes('boat')) return '🚤';
  if (s.includes('oxygen')) return '🫧';
  if (s.includes('water')) return '💧';
  if (s.includes('first aid') || s.includes('aid box') || s.includes('medical') || s.includes('medicine')) return '🩹';
  return '📦';
};

export const EmergencyHelpFeed: React.FC<EmergencyHelpFeedProps> = ({
  requests,
  filterStatus,
  searchQuery,
  selectedRequest,
  onSelectRequest,
  onOpenDispatchModal,
  onQuickDispatch,
}) => {
  // Filtering logic
  const filteredRequests = requests.filter(req => {
    const isSaved = req.is_saved || req.dispatched === 'yes' || req.dispatch_status === 'RESOLVED';
    // Status filter
    if (filterStatus === 'PENDING' && isSaved) return false;
    if (filterStatus === 'DISPATCHED' && (isSaved || req.dispatch_status !== 'DISPATCHED')) return false;
    if (filterStatus === 'RESOLVED' && !isSaved) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLoc = req.location_name.toLowerCase().includes(q);
      const matchMsg = req.message.toLowerCase().includes(q);
      const matchId = req.request_id.toLowerCase().includes(q) || req.node_id.toLowerCase().includes(q);
      const matchAid = (req.aid_required || req.needed_resources || []).some(a => a.toLowerCase().includes(q));
      return matchLoc || matchMsg || matchId || matchAid;
    }

    return true;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-red-600/30 text-red-300 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse">
            CRITICAL SOS
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            HIGH PRIORITY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-slate-700/50 text-slate-300">
            EMERGENCY
          </span>
        );
    }
  };

  const getDispatchBadge = (req: HelpRequest) => {
    const isSaved = req.is_saved || req.dispatched === 'yes' || req.dispatch_status === 'RESOLVED';

    if (isSaved) {
      return (
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SAVED
          </span>
          <span className="text-[10px] text-emerald-400/90 font-mono mt-0.5">উদ্ধার সম্পন্ন (Saved)</span>
        </div>
      );
    }

    if (req.dispatch_status === 'DISPATCHED' || req.dispatch_status === 'IN_TRANSIT') {
      return (
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            DISPATCHED
          </span>
          <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">উদ্ধারকারী প্রেরিত</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-red-600/20 text-red-400 border border-red-500/40">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          PENDING
        </span>
        <span className="text-[10px] text-red-400/80 font-mono mt-0.5">অপেক্ষমান (সাহায্য প্রয়োজন)</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      
      {/* Feed Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Emergency SOS Feed
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredRequests.length} Active)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Node ID, Location Requests & Material Dispatch Tracking
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Saved Lifecycle: <span className="text-emerald-400 font-bold">Dispatched = Yes</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[640px]">
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No emergency requests matching current filter.
          </div>
        ) : (
          filteredRequests.map(req => {
            const isSelected = selectedRequest?.request_id === req.request_id;
            const isSaved = req.is_saved || req.dispatched === 'yes' || req.dispatch_status === 'RESOLVED';
            const isPending = !isSaved && req.dispatch_status === 'PENDING';

            // Gather aid materials (from aid_required or needed_resources)
            const aidList = req.aid_required && req.aid_required.length > 0 
              ? req.aid_required 
              : (req.needed_resources && req.needed_resources.length > 0 ? req.needed_resources : ['rescue boat', 'drinking water']);

            return (
              <div
                key={req.request_id}
                onClick={() => onSelectRequest(req)}
                className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                    : isSaved
                    ? 'bg-emerald-950/15 border-emerald-900/40 hover:border-emerald-600/50'
                    : isPending
                    ? 'bg-gradient-to-r from-red-950/30 to-slate-900/80 border-red-900/40 hover:border-red-600/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Node ID, Urgency, and Dispatch/Saved Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-red-400 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Node {req.node_id}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      #{req.request_id}
                    </span>
                    {getUrgencyBadge(req.urgency)}
                  </div>
                  {getDispatchBadge(req)}
                </div>

                {/* Location Coordinates & Time (No victim name) */}
                <div className="mb-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-200 flex items-center gap-1.5 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-bold text-cyan-300">
                        {req.latitude.toFixed(4)}°N, {req.longitude.toFixed(4)}°E
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans truncate">
                        ({req.location_name})
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* LoRa Telemetry Status Strip (Rescue & Medicine Flags) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5 text-[10px] font-mono">
                  <div className={`px-2 py-1 rounded border flex items-center justify-between ${
                    req.rescue_needed !== false ? 'bg-red-950/40 border-red-800/60 text-red-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}>
                    <span>Rescue:</span>
                    <span className="font-bold">{req.rescue_needed !== false ? 'NEEDED' : 'NO'}</span>
                  </div>

                  <div className={`px-2 py-1 rounded border flex items-center justify-between ${
                    req.rescue_arrived ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}>
                    <span>Resq Arrived:</span>
                    <span className="font-bold">{req.rescue_arrived ? 'YES ✓' : 'NO'}</span>
                  </div>

                  <div className={`px-2 py-1 rounded border flex items-center justify-between ${
                    req.medicine_dispatched ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}>
                    <span>Med Dispatched:</span>
                    <span className="font-bold">{req.medicine_dispatched ? 'YES ✓' : 'NO'}</span>
                  </div>

                  <div className={`px-2 py-1 rounded border flex items-center justify-between ${
                    req.medicine_arrived ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}>
                    <span>Med Arrived:</span>
                    <span className="font-bold">{req.medicine_arrived ? 'YES ✓' : 'NO'}</span>
                  </div>
                </div>

                {/* Requested Materials Buttons */}
                <div className="mb-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-semibold tracking-wider">
                    Requested Aid Materials (প্রয়োজনীয় সামগ্রী):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {aidList.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatchModal(req);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 shadow-sm transition active:scale-95"
                        title={`Click to dispatch ${item}`}
                      >
                        <span>{getAidIcon(item)}</span>
                        <span className="capitalize">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Message Payload */}
                <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300 mb-2.5 font-mono">
                  &ldquo;{req.message}&rdquo;
                </div>

                {/* Dispatched Team Info (if dispatched or saved) */}
                {req.dispatched_team && (
                  <div className={`p-2 rounded-lg border text-xs mb-2.5 font-mono flex items-center justify-between ${
                    isSaved 
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' 
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                  }`}>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Unit:</span>
                      <span className="font-bold">{req.dispatched_team}</span>
                    </div>
                    {req.dispatch_time && (
                      <div className="text-right text-[10px] text-slate-400">
                        {new Date(req.dispatch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: Dispatch & Save */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-500">
                    Dispatched: <span className={isSaved ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {req.dispatched === 'yes' || isSaved ? 'YES (SAVED)' : 'NO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSaved ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickDispatch(req.request_id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] transition active:scale-95 flex items-center gap-1"
                        >
                          ⚡ Quick Dispatch
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDispatchModal(req);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        >
                          Assign Unit
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatchModal(req);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/50 transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Saved Record <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

