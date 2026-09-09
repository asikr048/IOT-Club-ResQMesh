import { NextResponse } from 'next/server';
import { HelpRequest, MeshNode, SystemLog, MeshPacketLog, DispatchStatus } from '@/types';
import { getMeshStore, setMeshStore, recalculateStats, resetMeshStore } from '@/lib/meshStore';
import { normalizeIncomingJson } from '@/lib/jsonParser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = getMeshStore();

  if (searchParams.get('reset') === 'true') {
    resetMeshStore();
  }

  // Slight realistic simulation of battery/RSSI drift on poll
  store.nodes = store.nodes.map(node => {
    if (node.status === 'OFFLINE') return node;
    const rssiJitter = Math.floor((Math.random() - 0.5) * 4);
    return {
      ...node,
      rssi: Math.min(-40, Math.max(-125, node.rssi + rssiJitter)),
      last_seen: new Date().toISOString()
    };
  });

  recalculateStats();

  return NextResponse.json(store, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      ...corsHeaders,
    }
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: unknown;

    // 1. Check if request is multipart/form-data (JSON file upload via HTTPS)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      let fileContent = '';

      for (const [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && 'text' in value && typeof (value as unknown as { text: () => Promise<string> }).text === 'function') {
          fileContent = await (value as unknown as { text: () => Promise<string> }).text();
          break;
        } else if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
          fileContent = value;
          break;
        }
      }

      if (!fileContent.trim()) {
        return NextResponse.json(
          { success: false, error: 'No JSON file or valid JSON content detected in form upload. Ensure file is sent with form field "file" or "json".' },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        body = JSON.parse(fileContent);
      } catch (parseErr) {
        return NextResponse.json(
          { success: false, error: 'Uploaded file is not valid JSON. Please verify formatting.' },
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // 2. Raw JSON or text payload
      const rawText = await request.text();
      if (!rawText.trim()) {
        return NextResponse.json(
          { success: false, error: 'Empty request payload. Send a valid JSON file or JSON body.' },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        body = JSON.parse(rawText);
      } catch (parseErr) {
        return NextResponse.json(
          { success: false, error: 'Request body is not valid JSON. Please verify formatting.' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const meshStore = getMeshStore();
    const parsedObj = body as Record<string, unknown>;

    // Case A: Specific UI Command Actions
    if (parsedObj && typeof parsedObj === 'object' && parsedObj.action) {
      const action = parsedObj.action;

      // Action 1: Update Dispatch Status ("dispatch hoise kina")
      if (action === 'update_dispatch') {
        const { request_id, dispatch_status, dispatched_team, team_contact, assigned_vehicle, notes } = parsedObj;
        
        const reqIndex = meshStore.help_requests.findIndex(r => r.request_id === request_id);
        if (reqIndex === -1) {
          return NextResponse.json({ success: false, error: 'Help request not found' }, { status: 404, headers: corsHeaders });
        }

        const existing = meshStore.help_requests[reqIndex];
        const prevStatus = existing.dispatch_status;

        meshStore.help_requests[reqIndex] = {
          ...existing,
          dispatch_status: dispatch_status as DispatchStatus,
          dispatched_team: dispatched_team ? String(dispatched_team) : existing.dispatched_team,
          team_contact: team_contact ? String(team_contact) : existing.team_contact,
          assigned_vehicle: assigned_vehicle !== undefined ? (assigned_vehicle as any) : existing.assigned_vehicle,
          notes: notes ? String(notes) : existing.notes,
          dispatch_time: dispatch_status === 'DISPATCHED' && !existing.dispatch_time ? new Date().toISOString() : existing.dispatch_time,
          resolved_time: dispatch_status === 'RESOLVED' ? new Date().toISOString() : existing.resolved_time
        };

        const logEntry: SystemLog = {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: dispatch_status === 'DISPATCHED' ? 'ALERT' : 'INFO',
          text: `Status updated for ${request_id} from ${prevStatus} to ${dispatch_status}. Assigned: ${dispatched_team || 'N/A'}`
        };
        meshStore.system_logs.unshift(logEntry);

        const pkt: MeshPacketLog = {
          id: `PKT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "GW-01",
          destination: existing.node_id,
          hops: 2,
          rssi: -65,
          snr: 9.0,
          type: "ACK",
          payload: `DISPATCH_ACK: REQ=${request_id}; STATUS=${dispatch_status}; TEAM=${dispatched_team || 'NONE'}`
        };
        meshStore.recent_packets = [pkt, ...(meshStore.recent_packets || [])].slice(0, 20);

        recalculateStats();

        return NextResponse.json({
          success: true,
          message: `Dispatch status updated to ${dispatch_status}`,
          help_request: meshStore.help_requests[reqIndex]
        }, { headers: corsHeaders });
      }

      // Action 2: Simulate Receiving New LoRa SOS Packet
      if (action === 'simulate_sos') {
        const { victim_name, location_name, latitude, longitude, urgency, message, needed_resources } = parsedObj;
        const newId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
        const nodeId = `NODE-SOS-${Math.floor(10 + Math.random() * 89)}`;

        const newHelpRequest: HelpRequest = {
          request_id: newId,
          node_id: nodeId,
          victim_name: String(victim_name || 'Emergency Beacon Caller'),
          location_name: String(location_name || 'Flood Affected Sector'),
          latitude: Number(latitude || 23.0600 + (Math.random() - 0.5) * 0.08),
          longitude: Number(longitude || 91.4300 + (Math.random() - 0.5) * 0.08),
          urgency: (urgency as any) || 'CRITICAL',
          message: String(message || 'Emergency help requested via LoRa mesh packet'),
          needed_resources: Array.isArray(needed_resources) ? needed_resources.map(String) : ['Medical Support', 'Rescue Boat'],
          dispatch_status: 'PENDING',
          dispatched_team: null,
          dispatch_time: null,
          timestamp: new Date().toISOString()
        };

        meshStore.help_requests.unshift(newHelpRequest);

        const newNode: MeshNode = {
          node_id: nodeId,
          name: `${victim_name || 'Victim Node'} (#${newId})`,
          role: 'CLIENT_NODE',
          latitude: newHelpRequest.latitude,
          longitude: newHelpRequest.longitude,
          altitude: 10,
          battery_percentage: Math.floor(20 + Math.random() * 60),
          rssi: -95,
          snr: 2.1,
          hop_count: 2,
          status: 'SOS',
          last_seen: new Date().toISOString(),
          packets_relayed: 1
        };
        meshStore.nodes.push(newNode);

        meshStore.system_logs.unshift({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'ALERT',
          text: `🚨 URGENT SOS PACKET DETECTED: ${newHelpRequest.victim_name} at ${newHelpRequest.location_name}`
        });

        const newPkt: MeshPacketLog = {
          id: `PKT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: nodeId,
          destination: "GW-01",
          hops: 2,
          rssi: -95,
          snr: 2.1,
          type: "SOS",
          payload: `INCOMING_SOS: ID=${newId}; URG=${urgency}; MSG=${message}`
        };
        meshStore.recent_packets = [newPkt, ...(meshStore.recent_packets || [])].slice(0, 20);

        recalculateStats();

        return NextResponse.json({ success: true, request_id: newId, help_request: newHelpRequest }, { headers: corsHeaders });
      }

      // Action 3: Mesh Broadcast Downlink
      if (action === 'send_broadcast') {
        const { text, channel } = parsedObj;
        const pkt: MeshPacketLog = {
          id: `PKT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "GW-01",
          destination: "ALL_MESH_NODES",
          hops: 0,
          rssi: 0,
          snr: 15.0,
          type: "BROADCAST",
          payload: `ALERT_BROADCAST: CH=${channel || 'EMERGENCY'}; MSG="${text}"`
        };

        meshStore.recent_packets = [pkt, ...(meshStore.recent_packets || [])].slice(0, 20);
        meshStore.system_logs.unshift({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          text: `Mesh Broadcast Transmitted: "${text}" on SF${meshStore.network.spreading_factor}`
        });

        return NextResponse.json({ success: true, message: 'Broadcast transmitted across mesh network' }, { headers: corsHeaders });
      }

      // Action 4: Reset to Default Dataset
      if (action === 'reset_data') {
        resetMeshStore();
        return NextResponse.json({ success: true, message: 'Data reset to default emergency simulation' }, { headers: corsHeaders });
      }
    }

    // Case B: Direct JSON File / Ingestion Request over HTTPS
    // Handles any JSON file with: number of node, node location, pending help message, dispatch hoise kina, etc.
    const result = normalizeIncomingJson(body, meshStore);
    setMeshStore(result.updatedStore);

    return NextResponse.json({
      success: true,
      message: result.message,
      nodes_ingested: result.nodesCount,
      requests_ingested: result.requestsCount,
      network: result.updatedStore.network,
      help_requests: result.updatedStore.help_requests,
      nodes: result.updatedStore.nodes
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error processing JSON request';
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
