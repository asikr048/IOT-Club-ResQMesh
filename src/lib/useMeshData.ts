'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FullMeshDataResponse, HelpRequest, MeshNode, DispatchStatus, VehicleType } from '@/types';
import { playSosAlert, playDispatchChime, playPacketChirp } from './soundAlert';

const DEFAULT_API_URL = '/api/mesh-data';

export function useMeshData() {
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_URL);
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const [pollInterval, setPollInterval] = useState<number>(4000); // 4 seconds default
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [data, setData] = useState<FullMeshDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Filter & Selection states
  const [filterDispatchStatus, setFilterDispatchStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [isSimulateSosModalOpen, setIsSimulateSosModalOpen] = useState<boolean>(false);

  // Tracking prev pending count to trigger SOS siren
  const prevPendingCountRef = useRef<number>(0);

  // Load persisted settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('lora_api_url');
      const savedProxy = localStorage.getItem('lora_use_proxy');
      const savedInterval = localStorage.getItem('lora_poll_interval');
      const savedSound = localStorage.getItem('lora_sound_enabled');

      if (savedUrl) setApiUrl(savedUrl);
      if (savedProxy !== null) setUseProxy(savedProxy === 'true');
      if (savedInterval) setPollInterval(Number(savedInterval));
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    }
  }, []);

  const saveSettings = (newUrl: string, proxy: boolean, interval: number, sound: boolean) => {
    setApiUrl(newUrl);
    setUseProxy(proxy);
    setPollInterval(interval);
    setSoundEnabled(sound);

    if (typeof window !== 'undefined') {
      localStorage.setItem('lora_api_url', newUrl);
      localStorage.setItem('lora_use_proxy', String(proxy));
      localStorage.setItem('lora_poll_interval', String(interval));
      localStorage.setItem('lora_sound_enabled', String(sound));
    }
  };

  // Compute effective fetch URL (with proxy if external and enabled)
  const getFetchUrl = useCallback(() => {
    if (apiUrl.startsWith('/') || apiUrl.includes(window?.location?.hostname || 'localhost')) {
      return apiUrl;
    }
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(apiUrl)}`;
    }
    return apiUrl;
  }, [apiUrl, useProxy]);

  // Main data fetch function
  const fetchData = useCallback(async () => {
    const startTime = performance.now();
    try {
      const url = getFetchUrl();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }
      const json: FullMeshDataResponse = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      // Trigger siren if new pending SOS arrives
      const pendingCount = json.help_requests?.filter(r => r.dispatch_status === 'PENDING').length || 0;
      if (pendingCount > prevPendingCountRef.current && soundEnabled && prevPendingCountRef.current > 0) {
        playSosAlert();
      }
      prevPendingCountRef.current = pendingCount;

      setData(json);
      setLatencyMs(elapsed);
      setLastSyncTime(new Date());
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mesh data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getFetchUrl, soundEnabled]);

  // Polling effect
  useEffect(() => {
    fetchData();

    if (!isPollingActive || pollInterval <= 0) return;

    const timer = setInterval(() => {
      fetchData();
    }, pollInterval);

    return () => clearInterval(timer);
  }, [fetchData, isPollingActive, pollInterval]);

  // Action: Update Dispatch Status ("dispatch hoise kina")
  const updateDispatch = async (
    requestId: string,
    status: DispatchStatus,
    dispatchedTeam?: string,
    teamContact?: string,
    assignedVehicle?: VehicleType | null,
    notes?: string
  ) => {
    // Optimistic UI update
    if (data) {
      setData(prev => {
        if (!prev) return prev;
        const updatedRequests = prev.help_requests.map(req => {
          if (req.request_id === requestId) {
            return {
              ...req,
              dispatch_status: status,
              dispatched_team: dispatchedTeam || req.dispatched_team,
              team_contact: teamContact || req.team_contact,
              assigned_vehicle: assignedVehicle !== undefined ? assignedVehicle : req.assigned_vehicle,
              notes: notes || req.notes,
              dispatch_time: status === 'DISPATCHED' ? new Date().toISOString() : req.dispatch_time,
              resolved_time: status === 'RESOLVED' ? new Date().toISOString() : req.resolved_time
            };
          }
          return req;
        });

        const pending = updatedRequests.filter(r => r.dispatch_status === 'PENDING').length;
        const dispatched = updatedRequests.filter(r => r.dispatch_status === 'DISPATCHED' || r.dispatch_status === 'IN_TRANSIT').length;
        const resolved = updatedRequests.filter(r => r.dispatch_status === 'RESOLVED').length;

        return {
          ...prev,
          network: {
            ...prev.network,
            pending_sos_count: pending,
            dispatched_count: dispatched,
            resolved_count: resolved
          },
          help_requests: updatedRequests
        };
      });

      if (soundEnabled) {
        playDispatchChime();
      }
    }

    try {
      const res = await fetch('/api/mesh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_dispatch',
          request_id: requestId,
          dispatch_status: status,
          dispatched_team: dispatchedTeam,
          team_contact: teamContact,
          assigned_vehicle: assignedVehicle,
          notes: notes
        })
      });

      if (!res.ok) {
        console.warn('Backend update returned status', res.status);
      }
      // Re-sync after update
      setTimeout(() => fetchData(), 500);
    } catch (err) {
      console.error('Failed to post dispatch status to backend', err);
    }
  };

  // Action: Broadcast downlink message
  const sendBroadcast = async (text: string, channel: string = 'EMERGENCY') => {
    if (soundEnabled) playPacketChirp();
    try {
      await fetch('/api/mesh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_broadcast', text, channel })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to send broadcast', err);
    }
  };

  // Action: Simulate Incoming SOS
  const simulateSos = async (payload: Partial<HelpRequest>) => {
    if (soundEnabled) playSosAlert();
    try {
      await fetch('/api/mesh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_sos', ...payload })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to simulate SOS', err);
    }
  };

  return {
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
    setIsPollingActive,
    setSoundEnabled,
    saveSettings,
    fetchData,
    updateDispatch,
    sendBroadcast,
    simulateSos
  };
}
