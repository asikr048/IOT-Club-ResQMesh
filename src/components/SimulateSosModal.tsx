'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Plus, MapPin } from 'lucide-react';
import { HelpRequest, UrgencyLevel } from '@/types';

interface SimulateSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSos: (data: Partial<HelpRequest>) => void;
}

export const SimulateSosModal: React.FC<SimulateSosModalProps> = ({
  isOpen,
  onClose,
  onSubmitSos,
}) => {
  const [victimName, setVictimName] = useState<string>('Habibur Rahman (Family of 5)');
  const [locationName, setLocationName] = useState<string>('Chhagalnaiya Embankment, Sector 2');
  const [latitude, setLatitude] = useState<number>(23.0450);
  const [longitude, setLongitude] = useState<number>(91.4850);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [message, setMessage] = useState<string>('Flood water reached chest level. Family stuck on tin roof, infant has high fever, urgent boat required.');
  const [resources, setResources] = useState<string>('Rescue Boat, Infant Paracetamol, Pure Water');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSos({
      victim_name: victimName,
      location_name: locationName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      urgency,
      message,
      needed_resources: resources.split(',').map(s => s.trim()).filter(Boolean)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-red-900/60 bg-slate-900/95 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-red-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Simulate Incoming LoRa SOS Packet
              </h3>
              <p className="text-xs font-mono text-red-300/80">
                Trigger mock disaster beacon to test alarms, map, and dispatch
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
              Victim Name / Group
            </label>
            <input
              type="text"
              value={victimName}
              onChange={(e) => setVictimName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Location Landmark
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
            >
              <option value="CRITICAL">🔴 CRITICAL (Life Threatening)</option>
              <option value="HIGH">🟠 HIGH (Immediate Danger)</option>
              <option value="MEDIUM">🟡 MEDIUM (Supplies Needed)</option>
              <option value="LOW">⚪ LOW (General Status)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              SOS Emergency Message
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Needed Supplies (comma separated)
            </label>
            <input
              type="text"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              placeholder="Rescue Boat, Drinking Water, Medical Kit"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-red-500"
            />
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
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Transmit Simulated SOS
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
