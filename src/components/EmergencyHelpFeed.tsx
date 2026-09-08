'use client';

import React from 'react';
import { HelpRequest, DispatchStatus } from '@/types';
import { AlertCircle, Clock, MapPin, Truck, CheckCircle2, ShieldAlert, LifeBuoy, ChevronRight, User, Phone } from 'lucide-react';

interface EmergencyHelpFeedProps {
  requests: HelpRequest[];
  filterStatus: string;
  searchQuery: string;
  selectedRequest: HelpRequest | null;
  onSelectRequest: (request: HelpRequest) => void;
  onOpenDispatchModal: (request: HelpRequest) => void;
  onQuickDispatch: (requestId: string) => void;
}

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
    // Status filter
    if (filterStatus === 'PENDING' && req.dispatch_status !== 'PENDING') return false;
    if (filterStatus === 'DISPATCHED' && req.dispatch_status !== 'DISPATCHED' && req.dispatch_status !== 'IN_TRANSIT') return false;
    if (filterStatus === 'RESOLVED' && req.dispatch_status !== 'RESOLVED') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.victim_name.toLowerCase().includes(q);
      const matchLoc = req.location_name.toLowerCase().includes(q);
      const matchMsg = req.message.toLowerCase().includes(q);
      const matchId = req.request_id.toLowerCase().includes(q) || req.node_id.toLowerCase().includes(q);
      const matchTeam = req.dispatched_team?.toLowerCase().includes(q);
      return matchName || matchLoc || matchMsg || matchId || matchTeam;
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
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono tracking-wider bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-slate-700/50 text-slate-300">
            STANDARD
          </span>
        );
    }
  };

  const getDispatchBadge = (status: DispatchStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-red-600/20 text-red-400 border border-red-500/40">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              NOT DISPATCHED
            </span>
            <span className="text-[10px] text-red-400/80 font-mono mt-0.5">অপেক্ষমান (সাহায্য প্রয়োজন)</span>
          </div>
        );
      case 'DISPATCHED':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Truck className="w-3 h-3 text-amber-400" />
              DISPATCHED
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">উদ্ধারকারী প্রেরিত</span>
          </div>
        );
      case 'IN_TRANSIT':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Truck className="w-3 h-3 text-cyan-400 animate-bounce" />
              IN TRANSIT
            </span>
            <span className="text-[10px] text-cyan-400/80 font-mono mt-0.5">পথে আছে</span>
          </div>
        );
      case 'RESOLVED':
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              RESCUED / RESOLVED
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">উদ্ধার সম্পন্ন</span>
          </div>
        );
    }
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
              Emergency SOS Help Feed
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredRequests.length} Active)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Pending Messages & Rescue Dispatch Status (ডিসপ্যাচ ট্র্যাকার)
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Auto-Sort: <span className="text-cyan-400">Urgency & Time</span>
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
            const isPending = req.dispatch_status === 'PENDING';

            return (
              <div
                key={req.request_id}
                onClick={() => onSelectRequest(req)}
                className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                    : isPending
                    ? 'bg-gradient-to-r from-red-950/30 to-slate-900/80 border-red-900/40 hover:border-red-600/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: IDs, Urgency, and Dispatch Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-red-400">
                      #{req.request_id}
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {req.node_id}
                    </span>
                    {getUrgencyBadge(req.urgency)}
                  </div>
                  {getDispatchBadge(req.dispatch_status)}
                </div>

                {/* Victim & Location Details */}
                <div className="mb-2">
                  <div className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {req.victim_name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{req.location_name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ({req.latitude.toFixed(4)}, {req.longitude.toFixed(4)})
                    </span>
                  </div>
                </div>

                {/* Emergency Message Payload */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-200 mb-2.5 font-mono">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    LoRa Emergency Message:
                  </span>
                  &ldquo;{req.message}&rdquo;
                </div>

                {/* Resource Tags */}
                {req.needed_resources && req.needed_resources.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span className="text-[10px] font-mono text-slate-500">Aid Required:</span>
                    {req.needed_resources.map((res, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700"
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dispatched Team Info (if dispatched) */}
                {req.dispatched_team && (
                  <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 mb-2.5 font-mono flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Unit:</span>
                      <span className="font-bold text-amber-300">{req.dispatched_team}</span>
                      {req.assigned_vehicle && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-amber-900/50 text-amber-300">
                          {req.assigned_vehicle}
                        </span>
                      )}
                    </div>
                    {req.dispatch_time && (
                      <div className="text-right text-[10px] text-slate-400">
                        Dispatched: {new Date(req.dispatch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: Dispatch Now / Manage Dispatch */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    {req.contact_info && (
                      <>
                        <Phone className="w-3 h-3 text-slate-500" />
                        {req.contact_info}
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending ? (
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
                          Details & Assign
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatchModal(req);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 transition flex items-center gap-1"
                      >
                        Update Dispatch Status <ChevronRight className="w-3.5 h-3.5" />
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
