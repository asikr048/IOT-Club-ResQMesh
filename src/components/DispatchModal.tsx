'use client';

import React, { useState, useEffect } from 'react';
import { HelpRequest, DispatchStatus, VehicleType } from '@/types';
import { X, Truck, CheckCircle2, ShieldAlert, Radio, Clock, AlertTriangle } from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  request: HelpRequest | null;
  onClose: () => void;
  onConfirmDispatch: (
    requestId: string,
    status: DispatchStatus,
    dispatchedTeam: string,
    teamContact: string,
    assignedVehicle: VehicleType | null,
    notes: string
  ) => void;
}

const PRESET_TEAMS = [
  'Bangladesh Army Flood Relief Unit Alpha',
  'Fire Service & Civil Defence Speedboat Team 2',
  'Bangladesh Coast Guard Coastal Patrol',
  'Red Crescent Cyclone Relief & Medical Unit',
  'Local Volunteer High-water Rescue Squad',
];

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  request,
  onClose,
  onConfirmDispatch,
}) => {
  const [status, setStatus] = useState<DispatchStatus>('DISPATCHED');
  const [team, setTeam] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [vehicle, setVehicle] = useState<VehicleType>('BOAT');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (request) {
      setStatus(request.dispatch_status === 'PENDING' ? 'DISPATCHED' : request.dispatch_status);
      setTeam(request.dispatched_team || PRESET_TEAMS[0]);
      setContact(request.team_contact || 'VHF Ch 16 / Sat Phone');
      setVehicle(request.assigned_vehicle || 'BOAT');
      setNotes(request.notes || '');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDispatch(request.request_id, status, team, contact, vehicle, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Rescue Dispatch Command (ডিসপ্যাচ কন্ট্রোল)
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Ticket: <span className="text-cyan-400 font-bold">{request.request_id}</span> • Node: {request.node_id}
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

        {/* SOS Details Summary */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              Node {request.node_id}
            </span>
            <span className="text-red-400 font-mono font-semibold uppercase">{request.urgency} Urgency</span>
          </div>
          <div className="text-slate-400 font-mono">
            📍 {request.latitude.toFixed(4)}°N, {request.longitude.toFixed(4)}°E ({request.location_name})
          </div>
          <p className="p-2 rounded bg-black/40 border border-slate-800/80 text-slate-300 font-mono">
            &ldquo;{request.message}&rdquo;
          </p>
          {(request.aid_required || request.needed_resources) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-mono text-slate-400">Aid Required:</span>
              {(request.aid_required && request.aid_required.length > 0 ? request.aid_required : request.needed_resources).map((res, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 capitalize">
                  {res}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Dispatch Status Selector ("dispatch hoise kina") */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
              Dispatch Status (ডিসপ্যাচ অবস্থা) <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'DISPATCHED', label: 'Dispatched (প্রেরিত)', color: 'border-amber-500 text-amber-400 bg-amber-950/40' },
                { val: 'IN_TRANSIT', label: 'In Transit (পথে আছে)', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/40' },
                { val: 'RESOLVED', label: 'Resolved (উদ্ধার সম্পন্ন)', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40' },
                { val: 'PENDING', label: 'Pending (অপেক্ষমান)', color: 'border-red-500 text-red-400 bg-red-950/40' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setStatus(opt.val as DispatchStatus)}
                  className={`p-2.5 rounded-lg border text-xs font-mono font-bold transition flex items-center justify-between ${
                    status === opt.val
                      ? `${opt.color} ring-1 ring-white/20 shadow-md`
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.val && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Rescue Team Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Assigned Rescue Team (উদ্ধারকারী দল)
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              {PRESET_TEAMS.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Type & Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value as VehicleType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="BOAT">🚤 Speedboat / Rescue Boat</option>
                <option value="HELICOPTER">🚁 Rescue Helicopter</option>
                <option value="AMBULANCE">🚑 Paramedic Ambulance</option>
                <option value="DRONE">🛰️ Heavy Relief Drone</option>
                <option value="4X4_TRUCK">🛻 4x4 High-Axle Truck</option>
                <option value="FOOT_PATROL">🦺 Foot Patrol Unit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Radio / Comm Channel
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="VHF Ch 16 / Tac-7"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Operator Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Mission Log Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Current ETA 10 minutes, carrying 2 oxygen cylinders and 40 dry food packets."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-sans focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Dispatch Update
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
