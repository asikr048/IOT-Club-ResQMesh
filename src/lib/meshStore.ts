import { FullMeshDataResponse, MeshNode, HelpRequest, SystemLog, MeshPacketLog } from '@/types';

const INITIAL_DATA: FullMeshDataResponse = {
  network: {
    network_name: "LoRa-Mesh-Emergency-BD",
    gateway_id: "GATEWAY-01-EOC-MAIN",
    frequency: "433.175 MHz",
    bandwidth: "125 kHz",
    spreading_factor: 11,
    coding_rate: "4/5",
    mesh_health: "OPTIMAL",
    total_nodes: 3,
    active_nodes: 3,
    pending_sos_count: 1,
    dispatched_count: 0,
    resolved_count: 0,
    last_sync: new Date().toISOString(),
  },
  nodes: [
    {
      node_id: "GW-01",
      name: "Node 1 - EOC Master Gateway",
      role: "GATEWAY",
      latitude: 23.0159,
      longitude: 91.3976,
      altitude: 18.2,
      battery_percentage: 100,
      battery_voltage: 13.8,
      rssi: -45,
      snr: 12.5,
      hop_count: 0,
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 350
    },
    {
      node_id: "RLY-02",
      name: "Node 2 - Mesh Relay Station",
      role: "RELAY",
      latitude: 23.0489,
      longitude: 91.4251,
      altitude: 35.0,
      battery_percentage: 85,
      battery_voltage: 4.1,
      rssi: -76,
      snr: 8.3,
      hop_count: 1,
      parent_node_id: "GW-01",
      status: "ONLINE",
      last_seen: new Date().toISOString(),
      packets_relayed: 120
    },
    {
      node_id: "SOS-03",
      name: "Node 3 - Field Emergency Beacon",
      role: "CLIENT_NODE",
      latitude: 23.0722,
      longitude: 91.4650,
      altitude: 9.5,
      battery_percentage: 38,
      battery_voltage: 3.65,
      rssi: -98,
      snr: -2.5,
      hop_count: 2,
      parent_node_id: "RLY-02",
      status: "SOS",
      last_seen: new Date().toISOString(),
      packets_relayed: 15
    }
  ],
  help_requests: [
    {
      request_id: "SOS-301",
      node_id: "SOS-03",
      victim_name: "Node SOS-03",
      contact_info: "LoRa ID #03, VHF Ch 16",
      location_name: "Sector (23.0722, 91.4650)",
      latitude: 23.0722,
      longitude: 91.4650,
      urgency: "CRITICAL",
      message: "Trapped in flood sector. Urgent rescue needed. Aid required: rescue boat, oxygen cylinder, drinking water, first aid box.",
      needed_resources: ["Rescue Boat", "Oxygen Cylinder", "Drinking Water", "First Aid Box"],
      aid_required: ["rescue boat", "oxygen cylinder", "drinking water", "first aid box"],
      rescue_needed: true,
      rescue_arrived: false,
      medicine_arrived: false,
      medicine_dispatched: false,
      dispatched: "no",
      is_saved: false,
      dispatch_status: "PENDING", // dispatch hoise kina -> NO
      dispatched_team: null,
      team_contact: null,
      assigned_vehicle: null,
      dispatch_time: null,
      notes: "Awaiting rescue team dispatch from EOC.",
      timestamp: new Date().toISOString()
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

// Global singleton to persist across Edge/Node hot-reloads during server runtime
declare global {
  // eslint-disable-next-line no-var
  var __globalMeshStore: FullMeshDataResponse | undefined;
}

if (!globalThis.__globalMeshStore) {
  globalThis.__globalMeshStore = JSON.parse(JSON.stringify(INITIAL_DATA));
}

export function getMeshStore(): FullMeshDataResponse {
  if (!globalThis.__globalMeshStore) {
    globalThis.__globalMeshStore = JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  return globalThis.__globalMeshStore!;
}

export function setMeshStore(newStore: FullMeshDataResponse): void {
  globalThis.__globalMeshStore = newStore;
}

export function recalculateStats(): void {
  const store = getMeshStore();
  const pending = store.help_requests.filter(r => r.dispatch_status === 'PENDING' && !r.is_saved).length;
  const dispatched = store.help_requests.filter(r => (r.dispatch_status === 'DISPATCHED' || r.dispatch_status === 'IN_TRANSIT') && !r.is_saved).length;
  const resolved = store.help_requests.filter(r => r.dispatch_status === 'RESOLVED' || r.is_saved).length;
  const activeNodes = store.nodes.filter(n => n.status !== 'OFFLINE').length;

  store.network.total_nodes = store.nodes.length;
  store.network.active_nodes = activeNodes;
  store.network.pending_sos_count = pending;
  store.network.dispatched_count = dispatched;
  store.network.resolved_count = resolved;
  store.network.last_sync = new Date().toISOString();
}

export function resetMeshStore(): void {
  globalThis.__globalMeshStore = JSON.parse(JSON.stringify(INITIAL_DATA));
}
