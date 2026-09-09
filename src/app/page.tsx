'use client';

import React, { useState } from 'react';
import { useMeshData } from '@/lib/useMeshData';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { TacticalMap } from '@/components/TacticalMap';
import { EmergencyHelpFeed } from '@/components/EmergencyHelpFeed';
import { NodeTable } from '@/components/NodeTable';
import { MeshTopologyGraph } from '@/components/MeshTopologyGraph';
import { BroadcastTerminal } from '@/components/BroadcastTerminal';
import { DispatchModal } from '@/components/DispatchModal';
import { ApiConfigModal } from '@/components/ApiConfigModal';
import { SimulateSosModal } from '@/components/SimulateSosModal';
import { BroadcastModal } from '@/components/BroadcastModal';
import { UploadJsonModal } from '@/components/UploadJsonModal';
import { 
  AlertOctagon, 
  Map, 
  Layers, 
  Terminal, 
  Download, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { HelpRequest } from '@/types';

export default function Home() {
  const {
    data,
    loading,
    error,
    lastSyncTime,
    latencyMs,
    apiUrl,
    useProxy,
    pollInterval,
    isPollingActive,
    soundEnabled,
    filterDispatchStatus,
    searchQuery,
    selectedNode,
    selectedRequest,
    isDispatchModalOpen,
    isApiModalOpen,
    isBroadcastModalOpen,
    isSimulateSosModalOpen,
    setFilterDispatchStatus,
    setSearchQuery,
    setSelectedNode,
    setSelectedRequest,
    setIsDispatchModalOpen,
    setIsApiModalOpen,
    setIsBroadcastModalOpen,
    setIsSimulateSosModalOpen,
    setSoundEnabled,
    saveSettings,
    fetchData,
    updateDispatch,
    sendBroadcast,
    simulateSos,
    toggleMaterialDispatch
  } = useMeshData();

  // Active view tab in Command Center
  const [activeViewTab, setActiveViewTab] = useState<'OPERATIONS' | 'TOPOLOGY' | 'LOGS'>('OPERATIONS');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [modalTargetRequest, setModalTargetRequest] = useState<HelpRequest | null>(null);

  const handleOpenDispatch = (req: HelpRequest) => {
    setModalTargetRequest(req);
    setIsDispatchModalOpen(true);
  };

  const handleQuickDispatch = (requestId: string) => {
    updateDispatch(
      requestId,
      'DISPATCHED',
      'Bangladesh Army Rapid Rescue Unit',
      'Tactical VHF Ch 16',
      'BOAT',
      'Immediate rescue unit dispatched via quick action command'
    );
  };

  // Export current telemetry snapshot as JSON
  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lora-mesh-eoc-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalPendingRequests = data?.help_requests.filter(
    r => r.urgency === 'CRITICAL' && r.dispatch_status === 'PENDING'
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 tactical-grid pb-12">
      
      {/* Header */}
      <Header
        network={data?.network}
        latencyMs={latencyMs}
        loading={loading}
        soundEnabled={soundEnabled}
        isPolling={isPollingActive}
        apiUrl={apiUrl}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onRefresh={fetchData}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenSosModal={() => setIsSimulateSosModalOpen(true)}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-5">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 flex items-center justify-between font-mono text-xs shadow-lg">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>Telemetry Sync Alert: {error}</span>
            </div>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-bold transition underline"
            >
              Configure API Link
            </button>
          </div>
        )}

        {/* Critical Pending SOS Banner (If any life-threatening pending requests exist) */}
        {criticalPendingRequests.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-600/20 border border-red-500/60 text-red-100 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-mono font-bold text-xs sm:text-sm">
                🚨 EMERGENCY ALERT: {criticalPendingRequests.length} Critical SOS Request(s) Awaiting Immediate Rescue Dispatch (উদ্ধারকারী পাঠানো প্রয়োজন)!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterDispatchStatus('PENDING');
                  setActiveViewTab('OPERATIONS');
                }}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-md transition"
              >
                View Pending SOS ({criticalPendingRequests.length})
              </button>
            </div>
          </div>
        )}

        {/* High-Level HUD Telemetry Cards */}
        <StatsCards
          network={data?.network}
          nodes={data?.nodes || []}
          onFilterChange={(status) => setFilterDispatchStatus(status)}
          activeFilter={filterDispatchStatus}
        />

        {/* View Switcher & Global Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveViewTab('OPERATIONS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                activeViewTab === 'OPERATIONS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Map className="w-4 h-4" />
              Tactical Map & Dispatch Feed
            </button>

            <button
              onClick={() => setActiveViewTab('TOPOLOGY')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                activeViewTab === 'TOPOLOGY'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Mesh Topology & Node Telemetry ({data?.nodes?.length || 0})
            </button>

            <button
              onClick={() => setActiveViewTab('LOGS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
                activeViewTab === 'LOGS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              RF Packet Log & Terminal
            </button>
          </div>

          {/* Quick Search & JSON Snapshot Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Download full LoRa mesh JSON data"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export JSON
            </button>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Configure API Endpoint"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              API URL
            </button>
          </div>

        </div>

        {/* VIEW 1: OPERATIONS COMMAND CENTER (Interactive Tactical Map + Emergency Dispatch Feed) */}
        {activeViewTab === 'OPERATIONS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              
              {/* Left: Tactical Geospatial Map (7 Columns on large screens) */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[520px] h-full">
                <TacticalMap
                  nodes={data?.nodes || []}
                  helpRequests={data?.help_requests || []}
                  selectedNode={selectedNode}
                  selectedRequest={selectedRequest}
                  onSelectNode={(node) => setSelectedNode(node)}
                  onSelectRequest={(req) => setSelectedRequest(req)}
                  onOpenDispatchModal={handleOpenDispatch}
                />
              </div>

              {/* Right: Emergency Help Feed & Dispatch Manager ("dispatch hoise kina") (5 Columns) */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[520px]">
                <EmergencyHelpFeed
                  requests={data?.help_requests || []}
                  filterStatus={filterDispatchStatus}
                  searchQuery={searchQuery}
                  selectedRequest={selectedRequest}
                  onSelectRequest={(req) => {
                    setSelectedRequest(req);
                  }}
                  onOpenDispatchModal={handleOpenDispatch}
                  onQuickDispatch={handleQuickDispatch}
                  onToggleMaterialDispatch={toggleMaterialDispatch}
                />
              </div>

            </div>

            {/* Quick Node Summary Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MeshTopologyGraph
                nodes={data?.nodes || []}
                selectedNode={selectedNode}
                onSelectNode={(n) => {
                  setSelectedNode(n);
                  setActiveViewTab('OPERATIONS');
                }}
              />
              <BroadcastTerminal
                logs={data?.system_logs || []}
                packets={data?.recent_packets || []}
                onSendBroadcast={sendBroadcast}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: TOPOLOGY & TELEMETRY VIEW */}
        {activeViewTab === 'TOPOLOGY' && (
          <div className="space-y-4">
            <MeshTopologyGraph
              nodes={data?.nodes || []}
              selectedNode={selectedNode}
              onSelectNode={(n) => setSelectedNode(n)}
            />
            <NodeTable
              nodes={data?.nodes || []}
              selectedNode={selectedNode}
              onSelectNode={(n) => {
                setSelectedNode(n);
                setActiveViewTab('OPERATIONS');
              }}
            />
          </div>
        )}

        {/* VIEW 3: RF PACKET LOGS & TERMINAL VIEW */}
        {activeViewTab === 'LOGS' && (
          <div className="space-y-4">
            <BroadcastTerminal
              logs={data?.system_logs || []}
              packets={data?.recent_packets || []}
              onSendBroadcast={sendBroadcast}
            />
            <NodeTable
              nodes={data?.nodes || []}
              selectedNode={selectedNode}
              onSelectNode={(n) => setSelectedNode(n)}
            />
          </div>
        )}

      </main>

      {/* MODALS */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        request={modalTargetRequest}
        onClose={() => setIsDispatchModalOpen(false)}
        onConfirmDispatch={(reqId, status, team, contact, vehicle, notes) => {
          updateDispatch(reqId, status, team, contact, vehicle, notes);
        }}
      />

      <ApiConfigModal
        isOpen={isApiModalOpen}
        currentUrl={apiUrl}
        useProxy={useProxy}
        pollInterval={pollInterval}
        soundEnabled={soundEnabled}
        onClose={() => setIsApiModalOpen(false)}
        onSave={saveSettings}
      />

      <SimulateSosModal
        isOpen={isSimulateSosModalOpen}
        onClose={() => setIsSimulateSosModalOpen(false)}
        onSubmitSos={simulateSos}
      />

      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSendBroadcast={sendBroadcast}
      />

      <UploadJsonModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      {/* Footer Info Strip */}
      <footer className="max-w-[1700px] w-full mx-auto px-4 mt-8 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 font-mono text-[11px] gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>LoRa Mesh Tactical Emergency Operating System (EOC) • Vercel Ready</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Active API: <code className="text-slate-400">{apiUrl}</code></span>
          <span>Last Sync: {lastSyncTime.toLocaleTimeString()}</span>
        </div>
      </footer>

    </div>
  );
}
