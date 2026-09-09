export type NodeRole = 'GATEWAY' | 'RELAY' | 'CLIENT_NODE' | 'RESCUE_TEAM';

export type NodeStatus = 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'SOS';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DispatchStatus = 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'RESOLVED';

export type VehicleType = 'BOAT' | 'HELICOPTER' | 'AMBULANCE' | 'DRONE' | 'FOOT_PATROL' | '4X4_TRUCK';

export interface MeshNode {
  node_id: string;
  name: string;
  role: NodeRole;
  latitude: number;
  longitude: number;
  altitude: number;
  battery_percentage: number;
  battery_voltage?: number;
  rssi: number; // in dBm e.g. -85
  snr: number; // in dB e.g. 8.5
  hop_count: number;
  parent_node_id?: string;
  status: NodeStatus;
  last_seen: string;
  packets_relayed?: number;
}

export interface HelpRequest {
  request_id: string;
  node_id: string;
  victim_name?: string;
  contact_info?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  urgency: UrgencyLevel;
  message: string;
  needed_resources: string[];
  aid_required?: string[]; // 'rescue boat', 'oxygen cylinder', 'drinking water', 'first aid box'
  rescue_needed?: boolean; // 'Rescue Needed'
  rescue_arrived?: boolean; // 'Resque Arrived'
  medicine_arrived?: boolean; // 'Medicine arrived'
  medicine_dispatched?: boolean; // 'medicine disatched'
  dispatched?: 'yes' | 'no' | string; // 'dispatched yes or no'
  is_saved?: boolean; // 'if yes then saved one'
  dispatch_status: DispatchStatus; // 'dispatch hoise kina'
  dispatched_team: string | null;
  team_contact?: string | null;
  assigned_vehicle?: VehicleType | null;
  dispatch_time: string | null;
  resolved_time?: string | null;
  notes?: string;
  timestamp: string;
}

export interface NetworkInfo {
  network_name: string;
  gateway_id: string;
  frequency: string;
  bandwidth: string;
  spreading_factor: number;
  coding_rate: string;
  mesh_health: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  total_nodes: number;
  active_nodes: number;
  pending_sos_count: number;
  dispatched_count: number;
  resolved_count: number;
  last_sync: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ALERT' | 'ERROR';
  text: string;
  node_id?: string;
}

export interface MeshPacketLog {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  hops: number;
  rssi: number;
  snr: number;
  type: 'SOS' | 'TELEMETRY' | 'ACK' | 'BROADCAST' | 'BEACON';
  payload: string;
}

export interface FullMeshDataResponse {
  network: NetworkInfo;
  nodes: MeshNode[];
  help_requests: HelpRequest[];
  system_logs: SystemLog[];
  recent_packets?: MeshPacketLog[];
}
