# 🛰️ LoRa Mesh Emergency Communication System (EOC Dashboard)

A high-tech, mission-critical Emergency Operations Center (EOC) web dashboard designed for off-grid LoRa Mesh disaster communication networks. Optimized for zero-configuration, one-click deployment to **Vercel**.

---

## 🌟 Key Features

1. **Mission-Critical Geospatial Map (Dark Mode)**:
   - Interactive Leaflet cartography with CartoDB Dark Matter tiles.
   - Dynamic node markers: Master Gateway, Multi-hop Relays, Mobile Rescue Units, and pulsating victim SOS pins.
   - Real-time LoRa mesh hop lines showing packet relay paths (`Gateway` ⟷ `Relay 1` ⟷ `Relay 2` ⟷ `Victim Node`).

2. **Victim SOS Feed & Dispatch Tracking ("Dispatch Hoise Kina")**:
   - Live feed of emergency help messages with urgency level badges (`CRITICAL`, `HIGH`, `MEDIUM`).
   - Detailed victim name, landmark location, GPS coordinates, needed resources (Boats, Oxygen, Medical, Water).
   - Clear bilingual status tags:
     - `PENDING` (অপেক্ষমান - Awaiting Dispatch)
     - `DISPATCHED` (উদ্ধারকারী প্রেরিত - Rescue Team En Route)
     - `IN_TRANSIT` (পথে আছে - Active Operation)
     - `RESOLVED` (উদ্ধার সম্পন্ন - Evacuation Complete)
   - One-click **Quick Dispatch** & comprehensive **Dispatch Command Modal** (assign Army, Fire Service, Red Crescent, Boat units, radio frequency channel, and mission notes).

3. **Multi-Hop Mesh Topology & Signal Telemetry**:
   - Multi-hop tree diagram displaying nodes by Tier (Hop Level 0 to 4).
   - Telemetry table with battery gauges, RSSI (dBm), SNR (dB), and GPS coordinates.
   - Packet Loss Rate and link quality monitoring.

4. **RF Packet Terminal & Downlink Broadcast**:
   - Real-time terminal log of decoded LoRa packets.
   - Emergency downlink broadcast form to transmit alerts down the mesh network.

5. **Self-Contained Audio Alarm**:
   - Synthesizes dual-tone emergency sirens and dispatch chimes using the Web Audio API without needing any external audio assets.

6. **Universal API Link Configurator**:
   - Change the API URL dynamically from the UI.
   - Test latency and sample payloads with a built-in tester.
   - Built-in CORS proxy (`/api/proxy?url=...`) to safely pull JSON from local ESP32 gateways without CORS or mixed-content browser restrictions.

---

## 📡 API JSON Schema

The dashboard connects to any API returning the following JSON schema (and includes a built-in simulation at `/api/mesh-data`):

```json
{
  "network": {
    "network_name": "LoRa-Mesh-Emergency-BD",
    "gateway_id": "GATEWAY-01-EOC-MAIN",
    "frequency": "433.175 MHz",
    "bandwidth": "125 kHz",
    "spreading_factor": 11,
    "mesh_health": "OPTIMAL",
    "total_nodes": 8,
    "active_nodes": 7,
    "pending_sos_count": 2,
    "dispatched_count": 2,
    "resolved_count": 1,
    "last_sync": "2026-09-08T07:45:00Z"
  },
  "nodes": [
    {
      "node_id": "GW-01",
      "name": "EOC Master Gateway",
      "role": "GATEWAY",
      "latitude": 23.0159,
      "longitude": 91.3976,
      "altitude": 18.2,
      "battery_percentage": 99,
      "rssi": -45,
      "snr": 12.5,
      "hop_count": 0,
      "status": "ONLINE",
      "last_seen": "2026-09-08T07:45:00Z"
    }
  ],
  "help_requests": [
    {
      "request_id": "SOS-9001",
      "node_id": "SOS-NODE-04",
      "victim_name": "Md. Faruq & Family (6 members)",
      "contact_info": "LoRa ID #04, VHF Ch 16",
      "location_name": "Chhagalnaiya Ward 4",
      "latitude": 23.0360,
      "longitude": 91.5120,
      "urgency": "CRITICAL",
      "message": "Water reached chest level. Family trapped on rooftop without food.",
      "needed_resources": ["Rescue Boat", "Drinking Water"],
      "dispatch_status": "PENDING",
      "dispatched_team": null,
      "dispatch_time": null,
      "timestamp": "2026-09-08T07:30:00Z"
    }
  ],
  "system_logs": [
    {
      "id": "LOG-1",
      "timestamp": "2026-09-08T07:45:00Z",
      "level": "INFO",
      "text": "Gateway synchronized with mesh nodes."
    }
  ],
  "recent_packets": [
    {
      "id": "PKT-1082",
      "timestamp": "2026-09-08T07:45:00Z",
      "source": "SOS-NODE-04",
      "destination": "GW-01",
      "hops: 3,
      "rssi": -108,
      "snr": -3.5,
      "type": "SOS",
      "payload": "TYPE=SOS;NID=4;URG=CRIT"
    }
  ]
}
```

---

## 🚀 One-Click Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework Preset: **Next.js** (detected automatically).
4. Click **Deploy**.
5. Once deployed, open your live dashboard and click **API Config** in the header to enter your live hardware gateway URL (or enjoy the pre-loaded disaster simulation immediately).

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
