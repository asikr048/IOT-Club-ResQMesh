import { NextResponse } from 'next/server';
import { FullMeshDataResponse, HelpRequest, MeshNode, SystemLog, MeshPacketLog, DispatchStatus } from '@/types';

// In-memory data store for server runtime (retained between requests in Node/Edge container)
let meshStore: FullMeshDataResponse = {
  network: {
    network_name: "LoRa-Mesh-Emergency-BD",
    gateway_id: "GATEWAY-01-EOC-MAIN",
    frequency: "433.175 MHz",
    bandwidth: "125 kHz",
    spreading_factor: 11,
    coding_rate: "4/5",
    mesh_health: "OPTIMAL",
    total_nodes: 8,
    active_nodes: 7,
    pending_sos_count: 2,
    dispatched_count: 2,
    resolved_count: 1,
    last_sync: new Date().toISOString(),
  },
  nodes: [
    {
      node_id: "GW-01",
      name: "EOC Master Gateway (DC Office)",
      role: "GATEWAY",
      latitude: 23.0159,
      longitude: 91.3976,
      altitude: 18.2,
      battery_percentage: 99,
      battery_voltage: 13.8,
      rssi: -45,
      snr: 12.5,
      hop_count: 0,
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 1420
    },
    {
      node_id: "RLY-02",
      name: "North Hill Relay Tower",
      role: "RELAY",
      latitude: 23.0489,
      longitude: 91.4251,
      altitude: 45.0,
      battery_percentage: 84,
      battery_voltage: 4.1,
      rssi: -76,
      snr: 8.3,
      hop_count: 1,
      parent_node_id: "GW-01",
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 640
    },
    {
      node_id: "RLY-03",
      name: "Muhuri Bridge Solar Node",
      role: "RELAY",
      latitude: 23.0722,
      longitude: 91.4650,
      altitude: 12.0,
      battery_percentage: 67,
      battery_voltage: 3.85,
      rssi: -92,
      snr: 4.1,
      hop_count: 2,
      parent_node_id: "RLY-02",
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 310
    },
    {
      node_id: "SOS-NODE-04",
      name: "Chhagalnaiya Ward-4 Refuge",
      role: "CLIENT_NODE",
      latitude: 23.0360,
      longitude: 91.5120,
      altitude: 9.5,
      battery_percentage: 28,
      battery_voltage: 3.42,
      rssi: -108,
      snr: -3.5,
      hop_count: 3,
      parent_node_id: "RLY-03",
      status: "SOS",
      last_seen: new Date().toISOString(),
      packets_relayed: 18
    },
    {
      node_id: "SOS-NODE-05",
      name: "Parshuram Govt School Shelter",
      role: "CLIENT_NODE",
      latitude: 23.1362,
      longitude: 91.4389,
      altitude: 11.2,
      battery_percentage: 52,
      battery_voltage: 3.74,
      rssi: -88,
      snr: 6.0,
      hop_count: 2,
      parent_node_id: "RLY-02",
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 75
    },
    {
      node_id: "RESCUE-06",
      name: "Army Rapid Rescue Boat Alpha",
      role: "RESCUE_TEAM",
      latitude: 23.0550,
      longitude: 91.4420,
      altitude: 8.0,
      battery_percentage: 91,
      battery_voltage: 12.6,
      rssi: -68,
      snr: 10.2,
      hop_count: 1,
      parent_node_id: "GW-01",
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 145
    },
    {
      node_id: "SOS-NODE-07",
      name: "Fulgazi Riverbank Community",
      role: "CLIENT_NODE",
      latitude: 23.0910,
      longitude: 91.4010,
      altitude: 10.1,
      battery_percentage: 16,
      battery_voltage: 3.31,
      rssi: -112,
      snr: -6.2,
      hop_count: 3,
      parent_node_id: "RLY-03",
      status: "SOS",
      last_seen: new Date().toISOString(),
      packets_relayed: 12
    },
    {
      node_id: "NODE-08",
      name: "Daganbhuiyan Sub-Station",
      role: "RELAY",
      latitude: 22.9560,
      longitude: 91.3120,
      altitude: 14.0,
      battery_percentage: 0,
      battery_voltage: 2.8,
      rssi: -128,
      snr: -12.0,
      hop_count: 4,
      status: "OFFLINE",
      last_seen: new Date(Date.now() - 3600000).toISOString(),
      packets_relayed: 20
    }
  ],
  help_requests: [
    {
      request_id: "SOS-9001",
      node_id: "SOS-NODE-04",
      victim_name: "Md. Faruq & Family (6 members)",
      contact_info: "LoRa ID #04, VHF Ch 16",
      location_name: "Chhagalnaiya Ward 4, House near Jam-e-Mosque",
      latitude: 23.0360,
      longitude: 91.5120,
      urgency: "CRITICAL",
      message: "Water reached chest level. Two children and pregnant mother trapped on rooftop without food for 24h.",
      needed_resources: ["Rescue Boat", "Emergency Rations", "Drinking Water", "First Aid"],
      dispatch_status: "PENDING", // dispatch hoise kina -> NO
      dispatched_team: null,
      team_contact: null,
      assigned_vehicle: null,
      dispatch_time: null,
      notes: "High priority: water rising 2 inches per hour.",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      request_id: "SOS-9002",
      node_id: "SOS-NODE-07",
      victim_name: "Dr. Anisul Haque (Clinic Shelter)",
      contact_info: "Mesh Node #07 / VHF 145.500",
      location_name: "Fulgazi Riverbank embankment breach point",
      latitude: 23.0910,
      longitude: 91.4010,
      urgency: "CRITICAL",
      message: "Elderly patient having acute asthma attack. Oxygen cylinder exhausted, flood current strong.",
      needed_resources: ["Oxygen Cylinder", "Medical Team", "High-power Speedboat"],
      dispatch_status: "DISPATCHED", // dispatch hoise kina -> YES
      dispatched_team: "Army Rapid Rescue Boat Alpha",
      team_contact: "Capt. Tanvir (Tactical Ch 7)",
      assigned_vehicle: "BOAT",
      dispatch_time: new Date(Date.now() - 8 * 60000).toISOString(),
      notes: "Rescue boat dispatched. ETA 12 minutes.",
      timestamp: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      request_id: "SOS-9003",
      node_id: "SOS-NODE-05",
      victim_name: "Headmaster Rafiqul Islam",
      contact_info: "Mesh Node #05",
      location_name: "Parshuram Govt Primary School Shelter",
      latitude: 23.1362,
      longitude: 91.4389,
      urgency: "HIGH",
      message: "120 flood victims stranded on roof and 1st floor. Clean drinking water exhausted, water purification tablets needed immediately.",
      needed_resources: ["Water Purification Tablets", "Dry Food Rations", "Infant Milk"],
      dispatch_status: "IN_TRANSIT", // dispatch hoise kina -> IN TRANSIT
      dispatched_team: "Red Crescent Cyclone Relief Team 3",
      team_contact: "Officer Salam (Sat Phone: 01711-XXXXXX)",
      assigned_vehicle: "DRONE",
      dispatch_time: new Date(Date.now() - 20 * 60000).toISOString(),
      notes: "Heavy-lift drone dropping 50kg food and water packs.",
      timestamp: new Date(Date.now() - 40 * 60000).toISOString()
    },
    {
      request_id: "SOS-9004",
      node_id: "NODE-08",
      victim_name: "Local Fishermen Group (4 people)",
      contact_info: "Mesh Node #08 (relayed via RLY-02)",
      location_name: "Daganbhuiyan Lower Basin",
      latitude: 22.9560,
      longitude: 91.3120,
      urgency: "MEDIUM",
      message: "Engine breakdown on trawler during flood evacuation. Anchored safely on tree line.",
      needed_resources: ["Towing Vessel", "Fuel Jerrycan (30L)"],
      dispatch_status: "RESOLVED", // dispatch hoise kina -> RESOLVED
      dispatched_team: "Fire Service & Civil Defence Unit 1",
      team_contact: "Station Officer Kabir",
      assigned_vehicle: "BOAT",
      dispatch_time: new Date(Date.now() - 90 * 60000).toISOString(),
      resolved_time: new Date(Date.now() - 10 * 60000).toISOString(),
      notes: "Successfully towed to Daganbhuiyan high ground. All 4 persons safe.",
      timestamp: new Date(Date.now() - 110 * 60000).toISOString()
    }
  ],
  system_logs: [
    {
      id: "LOG-1",
      timestamp: new Date().toISOString(),
      level: "INFO",
      text: "Gateway synced with 7 active mesh nodes. Master clock synchronized."
    },
    {
      id: "LOG-2",
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      level: "WARN",
      text: "Node SOS-NODE-07 battery critically low (16%). Recommending sleep cycle optimization.",
      node_id: "SOS-NODE-07"
    },
    {
      id: "LOG-3",
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      level: "ALERT",
      text: "Rescue Mission #SOS-9002 DISPATCHED: Army Boat Alpha en-route to Fulgazi Riverbank."
    },
    {
      id: "LOG-4",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      level: "ALERT",
      text: "NEW SOS PACKET RECEIVED from SOS-NODE-04: Water chest level, pregnant mother trapped."
    }
  ],
  recent_packets: [
    {
      id: "PKT-1082",
      timestamp: new Date().toISOString(),
      source: "SOS-NODE-04",
      destination: "GW-01",
      hops: 3,
      rssi: -108,
      snr: -3.5,
      type: "SOS",
      payload: "TYPE=SOS;NID=4;URG=CRIT;MSG=Water chest level;BAT=28"
    },
    {
      id: "PKT-1081",
      timestamp: new Date(Date.now() - 20000).toISOString(),
      source: "RESCUE-06",
      destination: "GW-01",
      hops: 1,
      rssi: -68,
      snr: 10.2,
      type: "TELEMETRY",
      payload: "TYPE=TEL;NID=6;LAT=23.0550;LON=91.4420;SPD=14kt;BAT=91"
    },
    {
      id: "PKT-1080",
      timestamp: new Date(Date.now() - 45000).toISOString(),
      source: "RLY-02",
      destination: "GW-01",
      hops: 1,
      rssi: -76,
      snr: 8.3,
      type: "BEACON",
      payload: "TYPE=BCN;NID=2;BAT=84;TEMP=28.4C;RELAY_OK=1"
    }
  ]
};

function recalculateStats() {
  const pending = meshStore.help_requests.filter(r => r.dispatch_status === 'PENDING').length;
  const dispatched = meshStore.help_requests.filter(r => r.dispatch_status === 'DISPATCHED' || r.dispatch_status === 'IN_TRANSIT').length;
  const resolved = meshStore.help_requests.filter(r => r.dispatch_status === 'RESOLVED').length;
  const activeNodes = meshStore.nodes.filter(n => n.status !== 'OFFLINE').length;

  meshStore.network.total_nodes = meshStore.nodes.length;
  meshStore.network.active_nodes = activeNodes;
  meshStore.network.pending_sos_count = pending;
  meshStore.network.dispatched_count = dispatched;
  meshStore.network.resolved_count = resolved;
  meshStore.network.last_sync = new Date().toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Slight realistic simulation of battery/RSSI drift if requested or on poll
  meshStore.nodes = meshStore.nodes.map(node => {
    if (node.status === 'OFFLINE') return node;
    const rssiJitter = Math.floor((Math.random() - 0.5) * 4);
    return {
      ...node,
      rssi: Math.min(-40, Math.max(-125, node.rssi + rssiJitter)),
      last_seen: new Date().toISOString()
    };
  });

  recalculateStats();

  return NextResponse.json(meshStore, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Update Dispatch Status ("dispatch hoise kina")
    if (action === 'update_dispatch') {
      const { request_id, dispatch_status, dispatched_team, team_contact, assigned_vehicle, notes } = body;
      
      const reqIndex = meshStore.help_requests.findIndex(r => r.request_id === request_id);
      if (reqIndex === -1) {
        return NextResponse.json({ success: false, error: 'Help request not found' }, { status: 404 });
      }

      const existing = meshStore.help_requests[reqIndex];
      const prevStatus = existing.dispatch_status;

      meshStore.help_requests[reqIndex] = {
        ...existing,
        dispatch_status: dispatch_status as DispatchStatus,
        dispatched_team: dispatched_team ?? existing.dispatched_team,
        team_contact: team_contact ?? existing.team_contact,
        assigned_vehicle: assigned_vehicle ?? existing.assigned_vehicle,
        notes: notes ?? existing.notes,
        dispatch_time: dispatch_status === 'DISPATCHED' && !existing.dispatch_time ? new Date().toISOString() : existing.dispatch_time,
        resolved_time: dispatch_status === 'RESOLVED' ? new Date().toISOString() : existing.resolved_time
      };

      // Add log
      const logEntry: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: dispatch_status === 'DISPATCHED' ? 'ALERT' : 'INFO',
        text: `Status updated for ${request_id} from ${prevStatus} to ${dispatch_status}. Assigned: ${dispatched_team || 'N/A'}`
      };
      meshStore.system_logs.unshift(logEntry);

      // Packet simulation
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
      });
    }

    // Action 2: Simulate Receiving New LoRa SOS Packet
    if (action === 'simulate_sos') {
      const { victim_name, location_name, latitude, longitude, urgency, message, needed_resources } = body;
      const newId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
      const nodeId = `NODE-SOS-${Math.floor(10 + Math.random() * 89)}`;

      const newHelpRequest: HelpRequest = {
        request_id: newId,
        node_id: nodeId,
        victim_name: victim_name || 'Emergency Beacon Caller',
        location_name: location_name || 'Flood Affected Sector',
        latitude: latitude || 23.0600 + (Math.random() - 0.5) * 0.08,
        longitude: longitude || 91.4300 + (Math.random() - 0.5) * 0.08,
        urgency: urgency || 'CRITICAL',
        message: message || 'Emergency help requested via LoRa mesh packet',
        needed_resources: needed_resources || ['Medical Support', 'Rescue Boat'],
        dispatch_status: 'PENDING',
        dispatched_team: null,
        dispatch_time: null,
        timestamp: new Date().toISOString()
      };

      meshStore.help_requests.unshift(newHelpRequest);

      // Add corresponding node
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

      // Add packet & log
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

      return NextResponse.json({ success: true, request_id: newId, help_request: newHelpRequest });
    }

    // Action 3: Mesh Broadcast Downlink
    if (action === 'send_broadcast') {
      const { text, channel } = body;
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

      return NextResponse.json({ success: true, message: 'Broadcast transmitted across mesh network' });
    }

    // Action 4: Reset to Default Dataset
    if (action === 'reset_data') {
      // Re-initialize with original values
      return NextResponse.json({ success: true, message: 'Data reset' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
