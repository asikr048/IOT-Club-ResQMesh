'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MeshNode, HelpRequest } from '@/types';

interface TacticalMapInnerProps {
  nodes: MeshNode[];
  helpRequests: HelpRequest[];
  selectedNode: MeshNode | null;
  selectedRequest: HelpRequest | null;
  onSelectNode: (node: MeshNode | null) => void;
  onSelectRequest: (request: HelpRequest | null) => void;
  onOpenDispatchModal: (request: HelpRequest) => void;
}

export const TacticalMapInner: React.FC<TacticalMapInnerProps> = ({
  nodes,
  helpRequests,
  selectedNode,
  selectedRequest,
  onSelectNode,
  onSelectRequest,
  onOpenDispatchModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered around disaster zone (Feni/Noakhali default or average of nodes)
    const initialLat = nodes.length > 0 ? nodes[0].latitude : 23.0159;
    const initialLng = nodes.length > 0 ? nodes[0].longitude : 91.3976;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Matter Tactical Map Tiles (CartoDB)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers & Polylines when data changes
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Map node id to node for drawing hop lines
    const nodeMap = new Map<string, MeshNode>();
    nodes.forEach(n => nodeMap.set(n.node_id, n));

    // 1. Draw Mesh Network Links (Parent -> Child relations)
    nodes.forEach(node => {
      if (node.parent_node_id && nodeMap.has(node.parent_node_id)) {
        const parent = nodeMap.get(node.parent_node_id)!;
        const isOffline = node.status === 'OFFLINE' || parent.status === 'OFFLINE';
        const linkColor = isOffline ? '#475569' : node.role === 'CLIENT_NODE' ? '#38bdf8' : '#06b6d4';

        const polyline = L.polyline(
          [
            [parent.latitude, parent.longitude],
            [node.latitude, node.longitude],
          ],
          {
            color: linkColor,
            weight: 2,
            opacity: isOffline ? 0.3 : 0.7,
            dashArray: isOffline ? '4, 8' : '6, 6',
          }
        );
        layerGroup.addLayer(polyline);
      }
    });

    // 2. Render LoRa Nodes
    nodes.forEach(node => {
      const isGateway = node.role === 'GATEWAY';
      const isRescue = node.role === 'RESCUE_TEAM';
      const isOffline = node.status === 'OFFLINE';
      const isSelected = selectedNode?.node_id === node.node_id;

      // Custom HTML Marker icon
      let markerHtml = '';
      if (isGateway) {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-12 h-12 rounded-full bg-cyan-500/20 radar-ping"></div>
            <div class="w-8 h-8 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#06b6d4] text-xs font-bold font-mono">
              GW
            </div>
          </div>
        `;
      } else if (isRescue) {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-10 h-10 rounded-full bg-emerald-500/20 radar-ping"></div>
            <div class="w-7 h-7 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_#10b981] text-[11px] font-bold">
              🚤
            </div>
          </div>
        `;
      } else {
        const borderColor = isOffline ? 'border-slate-600 bg-slate-800 text-slate-500' : 'border-sky-400 bg-sky-950 text-sky-300';
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer ${isSelected ? 'scale-125' : ''}">
            <div class="w-6 h-6 rounded-full border-2 ${borderColor} flex items-center justify-center shadow-lg text-[10px] font-mono font-bold">
              ${node.hop_count}H
            </div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-node',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });

      // Popup Content with detailed telemetry
      const popupHtml = `
        <div class="p-2.5 font-sans min-w-[210px]">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span class="font-mono font-bold text-xs text-cyan-400">${node.node_id}</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
              isOffline ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
            }">${node.status}</span>
          </div>
          <div class="text-xs font-semibold text-slate-100 mb-2">${node.name}</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-800 mb-2">
            <div>Role: <span class="text-white">${node.role}</span></div>
            <div>Hops: <span class="text-cyan-400">${node.hop_count}</span></div>
            <div>Battery: <span class="${node.battery_percentage < 25 ? 'text-red-400 font-bold' : 'text-emerald-400'}">${node.battery_percentage}%</span></div>
            <div>RSSI: <span class="text-amber-400">${node.rssi} dBm</span></div>
            <div class="col-span-2">SNR: <span class="text-slate-200">${node.snr} dB</span></div>
            <div class="col-span-2 text-[10px] text-slate-500 truncate">Coords: ${node.latitude.toFixed(4)}, ${node.longitude.toFixed(4)}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectNode(node);
      });

      layerGroup.addLayer(marker);
    });

    // 3. Render SOS Emergency Help Requests (Prominent pulsating victim pins)
    helpRequests.forEach(req => {
      const isSaved = req.is_saved || req.dispatched === 'yes' || req.dispatch_status === 'RESOLVED';
      const isDispatched = !isSaved && (req.dispatch_status === 'DISPATCHED' || req.dispatch_status === 'IN_TRANSIT');
      const isPending = !isSaved && !isDispatched;
      const isSelected = selectedRequest?.request_id === req.request_id;

      let pinHtml = '';
      if (isPending) {
        pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer ${isSelected ? 'scale-125' : ''}">
            <div class="absolute w-14 h-14 rounded-full bg-red-600/30 radar-ping"></div>
            <div class="absolute w-8 h-8 rounded-full bg-red-600/40 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-[0_0_20px_#ef4444] beacon-flash">
              SOS
            </div>
          </div>
        `;
      } else if (isDispatched) {
        pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-10 h-10 rounded-full bg-amber-500/25 radar-ping"></div>
            <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-900 font-bold text-xs shadow-[0_0_15px_#f59e0b]">
              🚚
            </div>
          </div>
        `;
      } else if (isSaved) {
        pinHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-emerald-300 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_#10b981]">
              ✓
            </div>
          </div>
        `;
      }

      const sosIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-leaflet-sos',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const sosMarker = L.marker([req.latitude, req.longitude], { icon: sosIcon });

      const statusBadge = isSaved
        ? '<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">SAVED (উদ্ধার সম্পন্ন)</span>'
        : isDispatched
        ? '<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">DISPATCHED (প্রেরিত)</span>'
        : '<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/40">PENDING (সাহায্য প্রয়োজন)</span>';

      const aidList = req.aid_required && req.aid_required.length > 0 
        ? req.aid_required 
        : (req.needed_resources || []);

      const aidBadges = aidList.map(a => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-mono">${a}</span>`).join(' ');

      const popupHtml = `
        <div class="p-2.5 font-sans min-w-[240px]">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span class="font-mono font-bold text-xs text-red-400">Node ${req.node_id}</span>
            ${statusBadge}
          </div>
          <div class="text-xs font-mono text-cyan-300 mb-1 flex items-center gap-1">
            📍 ${req.latitude.toFixed(4)}°N, ${req.longitude.toFixed(4)}°E
          </div>
          <p class="text-xs text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 mb-2 font-mono">
            "${req.message}"
          </p>
          ${aidList.length > 0 ? `
            <div class="text-[11px] mb-2 flex items-center gap-1 flex-wrap">
              <span class="text-slate-400 font-mono text-[10px]">Aid:</span>
              ${aidBadges}
            </div>
          ` : ''}
          ${req.dispatched_team ? `
            <div class="text-[11px] font-mono text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/40 mb-2">
              Team: ${req.dispatched_team}
            </div>
          ` : ''}
          <div class="flex items-center justify-between pt-1.5 border-t border-slate-800">
            <span class="text-[10px] font-mono text-slate-400">${new Date(req.timestamp).toLocaleTimeString()}</span>
            <button 
              id="btn-dispatch-${req.request_id}" 
              class="px-2.5 py-1 text-xs font-bold rounded ${isSaved ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-500'} text-white transition active:scale-95 shadow cursor-pointer font-mono"
            >
              ${isSaved ? '✓ Saved Record' : isDispatched ? 'Update Status' : '⚡ Dispatch Team'}
            </button>
          </div>
        </div>
      `;

      sosMarker.bindPopup(popupHtml);
      sosMarker.on('popupopen', () => {
        const btn = document.getElementById(`btn-dispatch-${req.request_id}`);
        if (btn) {
          btn.onclick = () => {
            onOpenDispatchModal(req);
          };
        }
      });
      sosMarker.on('click', () => {
        onSelectRequest(req);
      });

      layerGroup.addLayer(sosMarker);
    });
  }, [nodes, helpRequests, selectedNode, selectedRequest, onSelectNode, onSelectRequest, onOpenDispatchModal]);

  // Pan to selected node or request if changed
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedRequest) {
      mapRef.current.flyTo([selectedRequest.latitude, selectedRequest.longitude], 14, { duration: 1.2 });
    } else if (selectedNode) {
      mapRef.current.flyTo([selectedNode.latitude, selectedNode.longitude], 14, { duration: 1.2 });
    }
  }, [selectedNode, selectedRequest]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-[#070b14]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" />

      {/* Map HUD Overlay Controls */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-2 text-xs font-mono">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Tactical Map Legend
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-300"></span> Master Gateway
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-full bg-sky-600 border border-sky-300"></span> LoRa Mesh Relay
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white animate-pulse"></span> Pending SOS (অপেক্ষমান)
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span> Dispatched Unit (প্রেরিত)
        </div>
      </div>

      {/* Quick Center Reset Button */}
      <div className="absolute bottom-3 right-3 z-[400]">
        <button
          onClick={() => {
            if (mapRef.current && nodes.length > 0) {
              mapRef.current.flyTo([nodes[0].latitude, nodes[0].longitude], 12, { duration: 1 });
            }
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono shadow-md backdrop-blur-sm transition"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};
