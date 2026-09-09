'use client';

import React, { useState } from 'react';
import { X, Settings, Check, Globe, RefreshCw, AlertCircle, ShieldCheck, Database, UploadCloud } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  currentUrl: string;
  useProxy: boolean;
  pollInterval: number;
  soundEnabled: boolean;
  onClose: () => void;
  onSave: (newUrl: string, useProxy: boolean, pollInterval: number, soundEnabled: boolean) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  currentUrl,
  useProxy,
  pollInterval,
  soundEnabled,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState<string>(currentUrl);
  const [proxy, setProxy] = useState<boolean>(useProxy);
  const [interval, setInterval] = useState<number>(pollInterval);
  const [sound, setSound] = useState<boolean>(soundEnabled);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; sample?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const target = url.startsWith('/') || !proxy ? url : `/api/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(target, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setTestResult({
        success: true,
        message: `Connected successfully! Found ${data.nodes?.length || 0} nodes and ${data.help_requests?.length || 0} help requests.`,
        sample: JSON.stringify(data, null, 2).slice(0, 350) + '...'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      setTestResult({
        success: false,
        message: `Connection failed: ${msg}. Make sure URL is reachable or enable CORS server proxy.`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url.trim(), proxy, interval, sound);
    onClose();
  };

  const setBuiltinDefault = () => {
    setUrl('/api/mesh-data');
    setProxy(false);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                API Endpoint & Telemetry Settings
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Connect your live LoRa Gateway JSON link or test via built-in simulation
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

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setBuiltinDefault}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                url === '/api/mesh-data'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Built-in Simulation API
            </button>
            <span className="text-xs text-slate-600">or enter custom API link below:</span>
          </div>

          {/* API Link Input */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Live Gateway JSON API Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-lora-backend.com/api/mesh or /api/mesh-data"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-mono font-bold transition flex items-center gap-1 shrink-0"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Test API
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Supports: number of nodes, node coordinates, pending SOS messages, and dispatch status.
            </p>
          </div>

          {/* Test Result Box */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs font-mono ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/30 border-red-500/40 text-red-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                {testResult.message}
              </div>
              {testResult.sample && (
                <pre className="p-2 rounded bg-black/60 text-[10px] text-slate-300 overflow-x-auto max-h-24">
                  {testResult.sample}
                </pre>
              )}
            </div>
          )}

          {/* CORS Proxy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Vercel Server Proxy (Bypass CORS)</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Route external URLs via Next.js API to prevent mixed-content or CORS blocks
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={proxy}
                onChange={(e) => setProxy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Polling Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Auto-Refresh Rate
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={2000}>Fast (2 seconds)</option>
                <option value={4000}>Standard (4 seconds)</option>
                <option value={10000}>Battery Saver (10 seconds)</option>
                <option value={30000}>Slow (30 seconds)</option>
                <option value={0}>Disabled (Manual only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Audio Alarm for SOS
              </label>
              <button
                type="button"
                onClick={() => setSound(!sound)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold transition ${
                  sound
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                {sound ? '🔊 Audio Siren Active' : '🔇 Audio Muted'}
              </button>
            </div>
          </div>

          {/* HTTPS Ingestion Endpoint Information */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <UploadCloud className="w-3.5 h-3.5" /> HTTPS JSON Ingestion Endpoint
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">Active (Ready)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              External devices, Python scripts & LoRa gateways can POST JSON files or payloads to: <code className="text-cyan-300 font-mono">/api/mesh-data</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition active:scale-95 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
