import { FullMeshDataResponse, MeshNode, HelpRequest, DispatchStatus, NodeRole, UrgencyLevel, SystemLog } from '@/types';

/**
 * Normalizes dispatch status strings (supports English & Bengali variations e.g. "dispatch hoise kina")
 */
export function normalizeDispatchStatus(val: unknown): DispatchStatus {
  if (typeof val === 'boolean') {
    return val ? 'RESOLVED' : 'PENDING';
  }
  if (typeof val === 'number') {
    return val === 1 ? 'RESOLVED' : 'PENDING';
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['yes', 'true', '1', 'ha', 'hoise', 'dispatched', 'dispatch_hoise', 'done', 'saved', 'rescued', 'resolved', 'complete'].includes(s)) {
      return 'RESOLVED';
    }
    if (['no', 'false', '0', 'na', 'hoyni', 'pending', 'dispatch_hoyni', 'not_dispatched'].includes(s)) {
      return 'PENDING';
    }
    if (['in_transit', 'in transit', 'transit', 'en_route', 'running'].includes(s)) {
      return 'IN_TRANSIT';
    }
    if (['resolved', 'rescued', 'saved'].includes(s)) {
      return 'RESOLVED';
    }
  }
  return 'PENDING';
}

/**
 * Flexible property lookup from an object by trying various aliases,
 * ignoring casing, spaces, underscores, and hyphens.
 */
export function getFlexibleValue(obj: Record<string, unknown>, ...candidateKeys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  // 1. Direct match
  for (const key of candidateKeys) {
    if (obj[key] !== undefined) return obj[key];
  }

  // 2. Normalized match (remove spaces, underscores, hyphens, and convert to lowercase)
  const normalizedMap = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    const cleanKey = k.toLowerCase().replace(/[\s_-]+/g, '');
    normalizedMap.set(cleanKey, v);
  }

  for (const key of candidateKeys) {
    const cleanCandidate = key.toLowerCase().replace(/[\s_-]+/g, '');
    if (normalizedMap.has(cleanCandidate)) {
      return normalizedMap.get(cleanCandidate);
    }
  }

  return undefined;
}

/**
 * Flexible boolean parsing: handles "yes"/"no", "true"/"false", 1/0, "ha"/"na", etc.
 */
export function parseFlexibleBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return ['yes', 'true', '1', 'ha', 'hoise', 'y', 'done', 'saved', 'arrived', 'dispatched'].includes(s);
  }
  return false;
}

/**
 * Flexible list parsing: handles array of strings or comma-separated string
 */
export function parseFlexibleList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  }
  return [String(val).trim()];
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
    const lat = Number(getFlexibleValue(obj, 'latitude', 'lat', 'Latitude', 'Lat'));
    const lng = Number(getFlexibleValue(obj, 'longitude', 'lng', 'lon', 'Longitude', 'Lng', 'Lon'));
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return { latitude: defaultLat, longitude: defaultLng };
}

/**
 * Parses a single node from raw object
 */
export function parseSingleNode(raw: unknown, idx: number): MeshNode {
  const rec = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const coords = parseCoordinates(getFlexibleValue(rec, 'location', 'node_location', 'node location') ?? rec);

  const rawNodeId = getFlexibleValue(rec, 'node_id', 'node id', 'nodeId', 'id', 'node');
  const nodeId = String(rawNodeId ?? `NODE-${idx + 1}`);
  const rawName = getFlexibleValue(rec, 'name', 'label');
  const name = rawName ? String(rawName) : `Node ${nodeId}`;
  
  const rawRole = getFlexibleValue(rec, 'role');
  const role = (rawRole as NodeRole) || (idx === 0 && !rawRole ? 'GATEWAY' : 'RELAY');

  const rescueNeeded = parseFlexibleBoolean(getFlexibleValue(rec, 'Rescue Needed', 'rescue_needed', 'rescue needed', 'sos'));
  const status = rec.status === 'OFFLINE' ? 'OFFLINE' : (rec.status === 'SOS' || rescueNeeded) ? 'SOS' : 'ONLINE';

  return {
    node_id: nodeId,
    name: name,
    role: role,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: Number(getFlexibleValue(rec, 'altitude', 'alt') ?? 12),
    battery_percentage: Number(getFlexibleValue(rec, 'battery_percentage', 'battery', 'bat') ?? 85),
    battery_voltage: getFlexibleValue(rec, 'battery_voltage', 'voltage') ? Number(getFlexibleValue(rec, 'battery_voltage', 'voltage')) : undefined,
    rssi: Number(getFlexibleValue(rec, 'rssi') ?? -80),
    snr: Number(getFlexibleValue(rec, 'snr') ?? 8),
    hop_count: Number(getFlexibleValue(rec, 'hop_count', 'hops') ?? (role === 'GATEWAY' ? 0 : 1)),
    status: status,
    last_seen: new Date().toISOString(),
    packets_relayed: Number(getFlexibleValue(rec, 'packets_relayed') ?? 0),
  };
}

/**
 * Parses a single help request from raw object
 */
export function parseSingleHelpRequest(raw: unknown, idx: number): HelpRequest {
  const rec = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const coords = parseCoordinates(getFlexibleValue(rec, 'location', 'node_location', 'node location') ?? rec);

  const rawNodeId = getFlexibleValue(rec, 'node_id', 'node id', 'nodeId', 'id', 'node');
  const nodeId = String(rawNodeId ?? `NODE-${idx + 1}`);
  const reqId = String(getFlexibleValue(rec, 'request_id', 'id') ?? `SOS-${nodeId}`);

  // Boolean flags from exact user keys
  const rescueNeeded = parseFlexibleBoolean(getFlexibleValue(rec, 'Rescue Needed', 'rescue_needed', 'rescue needed', 'sos'));
  const rescueArrived = parseFlexibleBoolean(getFlexibleValue(rec, 'Resque Arrived', 'Rescue Arrived', 'rescue_arrived', 'rescue arrived'));
  const medicineArrived = parseFlexibleBoolean(getFlexibleValue(rec, 'Medicine arrived', 'medicine_arrived', 'medicine arrived'));
  const medicineDispatched = parseFlexibleBoolean(getFlexibleValue(rec, 'medicine disatched', 'medicine dispatched', 'medicine_dispatched'));
  
  // aid required
  const rawAid = getFlexibleValue(rec, 'aid required', 'aid_required', 'aid', 'needed_resources', 'resources');
  const aidRequired = parseFlexibleList(rawAid);

  // dispatched: yes or no
  const rawDispatched = getFlexibleValue(rec, 'dispatched', 'dispatch_hoise_kina', 'dispatch_status', 'is_dispatched');
  const isDispatchedYes = parseFlexibleBoolean(rawDispatched) || (typeof rawDispatched === 'string' && ['yes', 'true', 'saved', 'resolved', 'done'].includes(rawDispatched.trim().toLowerCase()));

  // If dispatched is yes, then saved one!
  const isSaved = isDispatchedYes || rescueArrived;
  const dispatchStatus: DispatchStatus = isSaved ? 'RESOLVED' : (rawDispatched ? normalizeDispatchStatus(rawDispatched) : (rescueNeeded ? 'PENDING' : 'PENDING'));

  const rawMsg = getFlexibleValue(rec, 'message', 'pending_help_message', 'help_message', 'text');
  const message = rawMsg ? String(rawMsg) : (rescueNeeded ? `Emergency rescue needed. Requested aid: ${aidRequired.join(', ') || 'General Relief'}` : 'Emergency assistance requested via LoRa mesh');

  // No name will be given just node id and location pending request
  const rawVictim = getFlexibleValue(rec, 'victim_name', 'victim');
  const victimName = rawVictim ? String(rawVictim) : `Node ${nodeId}`;
  
  const rawLoc = getFlexibleValue(rec, 'location_name');
  const locationName = rawLoc ? String(rawLoc) : `Sector (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;

  return {
    request_id: reqId,
    node_id: nodeId,
    victim_name: victimName,
    location_name: locationName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    urgency: (getFlexibleValue(rec, 'urgency') as UrgencyLevel) || 'CRITICAL',
    message: message,
    needed_resources: aidRequired.length > 0 ? aidRequired : ['Rescue Boat', 'Emergency Supplies'],
    aid_required: aidRequired,
    rescue_needed: rescueNeeded,
    rescue_arrived: rescueArrived,
    medicine_arrived: medicineArrived,
    medicine_dispatched: medicineDispatched,
    dispatched: isDispatchedYes ? 'yes' : 'no',
    is_saved: isSaved,
    dispatch_status: dispatchStatus,
    dispatched_team: getFlexibleValue(rec, 'dispatched_team') ? String(getFlexibleValue(rec, 'dispatched_team')) : (isSaved ? 'Assigned Response Unit' : null),
    dispatch_time: isDispatchedYes ? new Date().toISOString() : null,
    resolved_time: isSaved ? new Date().toISOString() : null,
    notes: getFlexibleValue(rec, 'notes') ? String(getFlexibleValue(rec, 'notes')) : undefined,
    timestamp: new Date().toISOString(),
  };
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
  if (!input || (typeof input !== 'object' && !Array.isArray(input))) {
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

  const importedNodes: MeshNode[] = [];
  const importedRequests: HelpRequest[] = [];

  // CASE 1: Array at root (e.g. 3 nodes: [ { "node id": "GW-01", ... }, ... ])
  if (Array.isArray(input)) {
    input.forEach((item, idx) => {
      if (typeof item !== 'object' || !item) return;
      const rec = item as Record<string, unknown>;
      
      // Node creation
      const node = parseSingleNode(rec, idx);
      importedNodes.push(node);

      // Check if this item is also an emergency request
      const hasRescueNeeded = getFlexibleValue(rec, 'Rescue Needed', 'rescue_needed', 'rescue needed') !== undefined;
      const hasAid = getFlexibleValue(rec, 'aid required', 'aid_required', 'aid') !== undefined;
      const hasDispatched = getFlexibleValue(rec, 'dispatched', 'dispatch_hoise_kina') !== undefined;
      const hasMessage = getFlexibleValue(rec, 'message', 'pending_help_message') !== undefined;
      const isSosStatus = rec.status === 'SOS';

      if (hasRescueNeeded || hasAid || hasDispatched || hasMessage || isSosStatus) {
        importedRequests.push(parseSingleHelpRequest(rec, idx));
      }
    });
  } else {
    // CASE 2: Object at root
    const root = input as Record<string, unknown>;

    // 1. Network / Summary keys
    const totalNodesVal = getFlexibleValue(root, 'number_of_nodes', 'number_of_node', 'number of node', 'total_nodes', 'node_count');
    if (typeof totalNodesVal === 'number') {
      newStore.network.total_nodes = totalNodesVal;
    }

    if (root.network && typeof root.network === 'object') {
      newStore.network = { ...newStore.network, ...(root.network as Record<string, unknown>) };
    }

    // 2. Node locations (array or single)
    const rawNodes = getFlexibleValue(root, 'nodes', 'node_location', 'node location', 'node_locations', 'locations');
    if (Array.isArray(rawNodes)) {
      rawNodes.forEach((n, i) => {
        if (typeof n !== 'object' || !n) return;
        const rec = n as Record<string, unknown>;
        importedNodes.push(parseSingleNode(rec, i));
        
        // Also check if node item has emergency status
        const hasRescueNeeded = getFlexibleValue(rec, 'Rescue Needed', 'rescue_needed', 'rescue needed') !== undefined;
        const hasAid = getFlexibleValue(rec, 'aid required', 'aid_required', 'aid') !== undefined;
        const hasDispatched = getFlexibleValue(rec, 'dispatched', 'dispatch_hoise_kina') !== undefined;
        if (hasRescueNeeded || hasAid || hasDispatched || rec.status === 'SOS') {
          importedRequests.push(parseSingleHelpRequest(rec, i));
        }
      });
    } else if (rawNodes && typeof rawNodes === 'object') {
      importedNodes.push(parseSingleNode(rawNodes, 0));
    }

    // 3. Pending Help Messages / SOS requests
    const rawRequests = getFlexibleValue(root, 'help_requests', 'pending_help_message', 'pending help message', 'help_messages', 'sos_requests');
    if (Array.isArray(rawRequests)) {
      rawRequests.forEach((r, i) => {
        importedRequests.push(parseSingleHelpRequest(r, i));
      });
    } else if (rawRequests && typeof rawRequests === 'object') {
      importedRequests.push(parseSingleHelpRequest(rawRequests, 0));
    } else if (typeof rawRequests === 'string') {
      importedRequests.push(parseSingleHelpRequest({ ...root, message: rawRequests }, 0));
    }

    // 4. Single node/request at root object if no array keys matched
    const rootNodeId = getFlexibleValue(root, 'node_id', 'node id', 'node');
    if (rootNodeId && importedNodes.length === 0) {
      importedNodes.push(parseSingleNode(root, 0));
      const hasRescueNeeded = getFlexibleValue(root, 'Rescue Needed', 'rescue_needed', 'rescue needed') !== undefined;
      const hasAid = getFlexibleValue(root, 'aid required', 'aid_required') !== undefined;
      const hasDispatched = getFlexibleValue(root, 'dispatched') !== undefined;
      if (hasRescueNeeded || hasAid || hasDispatched || root.status === 'SOS') {
        importedRequests.push(parseSingleHelpRequest(root, 0));
      }
    }

    // 5. Logs
    if (Array.isArray(root.system_logs)) {
      newStore.system_logs = [...(root.system_logs as SystemLog[]), ...newStore.system_logs].slice(0, 30);
    }
  }

  // Merge Nodes (update existing by node_id or append)
  if (importedNodes.length > 0) {
    importedNodes.forEach(newNode => {
      const idx = newStore.nodes.findIndex(n => n.node_id === newNode.node_id);
      if (idx !== -1) {
        newStore.nodes[idx] = { ...newStore.nodes[idx], ...newNode, last_seen: new Date().toISOString() };
      } else {
        newStore.nodes.unshift(newNode);
      }
    });
  }

  // Merge Help Requests (update existing by request_id or node_id or append)
  if (importedRequests.length > 0) {
    importedRequests.forEach(newReq => {
      const idx = newStore.help_requests.findIndex(r => r.request_id === newReq.request_id || r.node_id === newReq.node_id);
      if (idx !== -1) {
        newStore.help_requests[idx] = { ...newStore.help_requests[idx], ...newReq };
      } else {
        newStore.help_requests.unshift(newReq);
      }
    });
  }

  // Recalculate stats
  const pending = newStore.help_requests.filter(r => r.dispatch_status === 'PENDING' && !r.is_saved).length;
  const dispatched = newStore.help_requests.filter(r => (r.dispatch_status === 'DISPATCHED' || r.dispatch_status === 'IN_TRANSIT') && !r.is_saved).length;
  const resolved = newStore.help_requests.filter(r => r.dispatch_status === 'RESOLVED' || r.is_saved).length;
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
    text: `HTTPS Ingestion: Accepted JSON payload with ${importedNodes.length} node(s) and ${importedRequests.length} emergency request(s).`
  });

  return {
    updatedStore: newStore,
    nodesCount: importedNodes.length,
    requestsCount: importedRequests.length,
    message: `Successfully processed JSON: ${importedNodes.length} nodes, ${importedRequests.length} help requests.`
  };
}
