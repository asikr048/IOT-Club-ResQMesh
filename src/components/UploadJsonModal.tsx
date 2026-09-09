'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Copy, Check, Download, Terminal, Code } from 'lucide-react';
import { normalizeIncomingJson } from '@/lib/jsonParser';

interface UploadJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadJsonModal: React.FC<UploadJsonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE' | 'CURL_GUIDE'>('FILE');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setStatusMsg({ type: 'error', text: 'Please select a valid .json file.' });
      return;
    }
    setSelectedFile(file);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        setStatusMsg({
          type: 'success',
          text: `Valid JSON file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) ready to upload.`
        });
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'File contains invalid JSON formatting.' });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile && !jsonText.trim()) {
      setStatusMsg({ type: 'error', text: 'Please select a JSON file or paste JSON data.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg(null);

    try {
      let res: Response;

      if (activeTab === 'FILE' && selectedFile) {
        // Multipart form-data upload over HTTPS
        const formData = new FormData();
        formData.append('file', selectedFile);

        res = await fetch('/api/mesh-data', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Raw JSON POST
        const payload = JSON.parse(jsonText);
        res = await fetch('/api/mesh-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to ingest JSON file');
      }

      setStatusMsg({
        type: 'success',
        text: `✓ ${data.message || 'JSON accepted successfully! Mesh telemetry and dispatch status updated.'}`
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const curlCommand = `curl -X POST -F "file=@emergency_data.json" https://${typeof window !== 'undefined' ? window.location.host : 'your-app.vercel.app'}/api/mesh-data`;
  const rawCurlCommand = `curl -X POST -H "Content-Type: application/json" -d @emergency_data.json https://${typeof window !== 'undefined' ? window.location.host : 'your-app.vercel.app'}/api/mesh-data`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-cyan-900/60 bg-slate-900/95 shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <UploadCloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                HTTPS JSON Ingestion & File Upload
              </h3>
              <p className="text-xs font-mono text-cyan-300/80">
                Accepts JSON files with node coordinates, help messages & dispatch status
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

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('FILE')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === 'FILE'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload .json File
          </button>
          <button
            onClick={() => setActiveTab('PASTE')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === 'PASTE'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste JSON Text
          </button>
          <button
            onClick={() => setActiveTab('CURL_GUIDE')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition ${
              activeTab === 'CURL_GUIDE'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            cURL / API Webhook
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* TAB 1: File Drag & Drop */}
          {activeTab === 'FILE' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop .json file here'}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  Supports JSON with: number of node, node location, pending help message, dispatch hoise kina
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Need a sample JSON format?</span>
                <a
                  href="/emergency_sample.json"
                  download="emergency_sample.json"
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 underline"
                >
                  <Download className="w-3.5 h-3.5" /> Download Sample JSON
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: Paste JSON */}
          {activeTab === 'PASTE' && (
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-slate-300">
                Paste JSON Payload
              </label>
              <textarea
                rows={7}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`{\n  "number_of_node": 4,\n  "node_location": [\n    { "node_id": "NODE-1", "lat": 23.0159, "lng": 91.3976, "battery": 80 }\n  ],\n  "pending_help_message": [\n    { "request_id": "SOS-1", "victim_name": "Rahim", "message": "Flood water rising", "dispatch_hoise_kina": "no" }\n  ]\n}`}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* TAB 3: HTTPS cURL Guide */}
          {activeTab === 'CURL_GUIDE' && (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-300 text-xs font-sans">
                You can upload JSON files or send live payloads directly from terminal, Python, ESP32, or IoT gateways to this HTTPS endpoint:
              </p>

              <div>
                <div className="flex items-center justify-between text-[11px] text-cyan-400 mb-1">
                  <span>1. Upload JSON File via cURL (multipart/form-data):</span>
                  <button
                    onClick={() => copyToClipboard(curlCommand)}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black/70 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                  {curlCommand}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-cyan-400 mb-1">
                  <span>2. Send Raw JSON Payload (Content-Type: application/json):</span>
                  <button
                    onClick={() => copyToClipboard(rawCurlCommand)}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black/70 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                  {rawCurlCommand}
                </pre>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                Endpoint URL: <span className="font-bold text-white">/api/mesh-data</span> or <span className="font-bold text-white">/api/upload</span>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>
            {activeTab !== 'CURL_GUIDE' && (
              <button
                type="button"
                onClick={handleUploadFile}
                disabled={isUploading || (!selectedFile && !jsonText.trim())}
                className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition active:scale-95 flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                {isUploading ? 'Ingesting...' : 'Upload & Update Dashboard'}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
