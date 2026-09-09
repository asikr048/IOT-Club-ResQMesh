import { FullMeshDataResponse, MeshNode, HelpRequest, DispatchStatus, NodeRole, UrgencyLevel, SystemLog } from '@/types';

/**
 * Normalizes dispatch status strings (supports English & Bengali variations e.g. "dispatch hoise kina")
 */
export function normalizeDispatchStatus(val: unknown): DispatchStatus {
  if (typeof val === 'boolean') {
    return val ? 'DISPATCHED' : 'PENDING';
  }
  if (typeof val === 'number') {
    return val === 1 ? 'DISPATCHED' : 'PENDING';
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['yes', 'true', '1', 'ha', 'hoise', 'dispatched', 'dispatch_hoise', 'done'].includes(s)) {
      return 'DISPATCHED';
    }
    if (['no', 'false', '0', 'na', 'hoyni', 'pending', 'dispatch_hoyni', 'not_dispatched'].includes(s)) {
      return 'PENDING';
    }
    if (['in_transit', 'in transit', 'transit', 'en_route', 'running'].includes(s)) {
      return 'IN_TRANSIT';
    }
    if (['resolved', 'done', 'rescued', 'complete', 'completed'].includes(s)) {
      return 'RESOLVED';
    }
  }
  return 'PENDING';
}

/**
 * Parse coordinates from various formats:
 * - { lat: 23.01, lng: 91.39 }
 * - { latitude: 23.01, longitude: 91.39 }
 * - "23.0159, 91.3976"
 * - [23.0159, 91.3976]
 */
export function parseCoordinates(val: unknown): { latitude: number; longitude: number } {
  const defaultLat = 23.0159;
  const defaultLng = 91.3976;

  if (!val) return { latitude: defaultLat, longitude: defaultLng };

  if (typeof val === 'string') {
    const parts = val.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      return { latitude: parts[0], longitude: parts[1] };
    }
  }

  if (Array.isArray(val) && val.length >= 2) {
    const lat = Number(val[0]);
    const lng = Number(val[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const lat = Number(obj.latitude ?? obj.lat ?? obj.Latitude ?? obj.Lat);
    const lng = Number(obj.longitude ?? obj.lng ?? obj.lon ?? obj.Longitude ?? obj.Lng ?? obj.Lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return { latitude: defaultLat, longitude: defaultLng };
}

/**
 * Ingest and normalize any incoming JSON (full mesh schema or custom gateway keys)
 */
export function normalizeIncomingJson(
  input: unknown,
  existingStore: FullMeshDataResponse
): {
  updatedStore: FullMeshDataResponse;
  nodesCount: number;
  requestsCount: number;
  message: string;
} {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid JSON: payload must be a JSON object or array');
  }

  const newStore: FullMeshDataResponse = {
    ...existingStore,
    network: { ...existingStore.network },
    nodes: [...existingStore.nodes],
    help_requests: [...existingStore.help_requests],
    system_logs: [...existingStore.system_logs],
    recent_packets: [...(existingStore.recent_packets || [])],
  };

  let importedNodes: MeshNode[] = [];
  let importedRequests: HelpRequest[] = [];

  // CASE 1: Array at root
  if (Array.isArray(input)) {
    // Check first element to see if it's nodes or requests
    input.forEach((item, idx) => {
      if (typeof item !== 'object' || !item) return;
      const rec = item as Record<string, unknown>;
      if (rec.message || rec.pending_help_message || rec.victim_name || rec.dispatch_hoise_kina !== undefined) {
        // Help request
        importedRequests.push(parseSingleHelpRequest(rec, idx));
      } else {
        // Node
        importedNodes.push(parseSingleNode(rec, idx));
      }
    });
  } else {
    // CASE 2: Object at root
    const root = input as Record<string, unknown>;

    // 1. Network / Summary keys
    const totalNodesVal = root.number_of_nodes ?? root.number_of_node ?? root.total_nodes ?? root.node_count;
    if (typeof totalNodesVal === 'number') {
      newStore.network.total_nodes = totalNodesVal;
    }

    if (root.network && typeof root.network === 'object') {
      newStore.network = { ...newStore.network, ...(root.network as Record<string, unknown>) };
    }

    // 2. Node locations (array or single)
    const rawNodes = root.nodes ?? root.node_location ?? root.node_locations ?? root.locations;
    if (Array.isArray(rawNodes)) {
      importedNodes = rawNodes.map((n, i) => parseSingleNode(n, i));
    } else if (rawNodes && typeof rawNodes === 'object') {
      importedNodes = [parseSingleNode(rawNodes, 0)];
    }

    // 3. Pending Help Messages / SOS requests
    const rawRequests = root.help_requests ?? root.pending_help_message ?? root.pending_help_messages ?? root.help_messages ?? root.sos_requests;
    if (Array.isArray(rawRequests)) {
      importedRequests = rawRequests.map((r, i) => parseSingleHelpRequest(r, i));
    } else if (rawRequests && typeof rawRequests === 'object') {
      importedRequests = [parseSingleHelpRequest(rawRequests, 0)];
    } else if (typeof rawRequests === 'string') {
      // Direct string pending help message at root!
      const coords = parseCoordinates(root.node_location ?? root.location);
      importedRequests.push({
        request_id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
        node_id: String(root.node_id ?? root.node ?? 'NODE-HTTPS-1'),
        victim_name: String(root.victim_name ?? root.victim ?? 'Emergency Caller'),
        location_name: String(root.location_name ?? root.location ?? 'Reported Disaster Sector'),
        latitude: coords.latitude,
        longitude: coords.longitude,
        urgency: (root.urgency as UrgencyLevel) || 'CRITICAL',
        message: rawRequests,
        needed_resources: Array.isArray(root.needed_resources) ? root.needed_resources.map(String) : ['Emergency Relief'],
        dispatch_status: normalizeDispatchStatus(root.dispatch_hoise_kina ?? root.dispatch_status ?? root.dispatched),
        dispatched_team: root.dispatched_team ? String(root.dispatched_team) : null,
        dispatch_time: null,
        timestamp: new Date().toISOString()
      });
    }

    // 4. Logs
    if (Array.isArray(root.system_logs)) {
      newStore.system_logs = [...(root.system_logs as SystemLog[]), ...newStore.system_logs].slice(0, 30);
    }
  }

  // Merge Nodes (update existing by node_id or append)
  if (importedNodes.length > 0) {
    const existingNodeIds = new Set(newStore.nodes.map(n => n.node_id));
    importedNodes.forEach(newNode => {
      const idx = newStore.nodes.findIndex(n => n.node_id === newNode.node_id);
      if (idx !== -1) {
        newStore.nodes[idx] = { ...newStore.nodes[idx], ...newNode, last_seen: new Date().toISOString() };
      } else {
        newStore.nodes.unshift(newNode);
      }
    });
  }

  // Merge Help Requests (update existing by request_id or append)
  if (importedRequests.length > 0) {
    importedRequests.forEach(newReq => {
      const idx = newStore.help_requests.findIndex(r => r.request_id === newReq.request_id);
      if (idx !== -1) {
        newStore.help_requests[idx] = { ...newStore.help_requests[idx], ...newReq };
      } else {
        newStore.help_requests.unshift(newReq);
      }
    });
  }

  // Recalculate stats
  const pending = newStore.help_requests.filter(r => r.dispatch_status === 'PENDING').length;
  const dispatched = newStore.help_requests.filter(r => r.dispatch_status === 'DISPATCHED' || r.dispatch_status === 'IN_TRANSIT').length;
  const resolved = newStore.help_requests.filter(r => r.dispatch_status === 'RESOLVED').length;
  const activeNodes = newStore.nodes.filter(n => n.status !== 'OFFLINE').length;

  newStore.network.total_nodes = newStore.nodes.length;
  newStore.network.active_nodes = activeNodes;
  newStore.network.pending_sos_count = pending;
  newStore.network.dispatched_count = dispatched;
  newStore.network.resolved_count = resolved;
  newStore.network.last_sync = new Date().toISOString();

  // Add system log entry
  newStore.system_logs.unshift({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    text: `HTTPS Ingestion: Accepted JSON payload with ${importedNodes.length} nodes and ${importedRequests.length} emergency requests.`
  });

  return {
    updatedStore: newStore,
    nodesCount: importedNodes.length,
    requestsCount: importedRequests.length,
    message: `Successfully processed JSON: ${importedNodes.length} nodes, ${importedRequests.length} help requests.`
  };
}

function parseSingleNode(raw: unknown, idx: number): MeshNode {
  const rec = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const coords = parseCoordinates(rec.location ?? rec.node_location ?? rec);

  const nodeId = String(rec.node_id ?? rec.id ?? rec.node ?? `NODE-${idx + 1}`);
  const name = String(rec.name ?? rec.label ?? `Node ${nodeId}`);
  const role = (rec.role as NodeRole) || (idx === 0 && !rec.role ? 'GATEWAY' : 'RELAY');

  return {
    node_id: nodeId,
    name: name,
    role: role,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: Number(rec.altitude ?? rec.alt ?? 12),
    battery_percentage: Number(rec.battery_percentage ?? rec.battery ?? rec.bat ?? 85),
    battery_voltage: rec.battery_voltage ? Number(rec.battery_voltage) : undefined,
    rssi: Number(rec.rssi ?? -80),
    snr: Number(rec.snr ?? 8),
    hop_count: Number(rec.hop_count ?? rec.hops ?? (role === 'GATEWAY' ? 0 : 1)),
    status: rec.status === 'OFFLINE' ? 'OFFLINE' : rec.status === 'SOS' ? 'SOS' : 'ONLINE',
    last_seen: new Date().toISOString(),
    packets_relayed: Number(rec.packets_relayed ?? 0),
  };
}

function parseSingleHelpRequest(raw: unknown, idx: number): HelpRequest {
  const rec = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const coords = parseCoordinates(rec.location ?? rec.node_location ?? rec);

  const reqId = String(rec.request_id ?? rec.id ?? `SOS-${Math.floor(8000 + idx * 100 + Math.random() * 90)}`);
  const message = String(rec.message ?? rec.pending_help_message ?? rec.help_message ?? rec.text ?? 'Urgent emergency assistance requested via LoRa');
  const victimName = String(rec.victim_name ?? rec.victim ?? rec.name ?? 'Disaster Victim Group');
  const locationName = String(rec.location_name ?? rec.location ?? 'Designated Flood Refuge');

  // Interpret "dispatch hoise kina"
  const dispatchStatus = normalizeDispatchStatus(
    rec.dispatch_hoise_kina ?? rec.dispatch_status ?? rec.dispatched ?? rec.is_dispatched
  );

  return {
    request_id: reqId,
    node_id: String(rec.node_id ?? rec.node ?? `NODE-SOS-${idx + 1}`),
    victim_name: victimName,
    location_name: locationName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    urgency: (rec.urgency as UrgencyLevel) || 'CRITICAL',
    message: message,
    needed_resources: Array.isArray(rec.needed_resources)
      ? rec.needed_resources.map(String)
      : ['Rescue Boat', 'Emergency Food'],
    dispatch_status: dispatchStatus,
    dispatched_team: rec.dispatched_team ? String(rec.dispatched_team) : null,
    dispatch_time: dispatchStatus === 'DISPATCHED' ? new Date().toISOString() : null,
    notes: rec.notes ? String(rec.notes) : undefined,
    timestamp: new Date().toISOString(),
  };
}
