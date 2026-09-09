/*
 * ======================================================================================
 * ESP32 LoRa Mesh Gateway -> HTTPS Ingestion Example for ResQMesh EOC Dashboard
 * ======================================================================================
 * 
 * This example demonstrates how an ESP32 LoRa Gateway connects to Wi-Fi, formats 
 * received LoRa mesh packet telemetry & SOS help requests into JSON, and sends it 
 * to your Vercel Next.js EOC Dashboard via HTTPS POST.
 * 
 * Works with:
 * - ESP32 Dev Module / ESP32-WROOM / ESP32-S3
 * - TTGO T-Beam / Heltec WiFi LoRa 32 / SX1276 / SX1262
 * 
 * Target Endpoint:
 * - https://your-project.vercel.app/api/mesh-data
 * ======================================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ---------------------- 1. WI-FI CREDENTIALS ----------------------
const char* ssid     = "YOUR_WIFI_SSID";         // Replace with your Wi-Fi SSID or mobile hotspot
const char* password = "YOUR_WIFI_PASSWORD";     // Replace with your Wi-Fi Password

// ---------------------- 2. VERCEL SERVER URL -----------------------
// Replace with your actual Vercel deployment URL
const char* serverUrl = "https://your-project.vercel.app/api/mesh-data";

// How frequently to send updates to the dashboard (in milliseconds)
const unsigned long postInterval = 10000; // 10 seconds
unsigned long lastPostTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- ResQMesh ESP32 LoRa Gateway Initializing ---");

  // Connect to Wi-Fi
  connectToWiFi();
}

void loop() {
  // Check Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Send periodic telemetry & SOS updates
  if (millis() - lastPostTime >= postInterval) {
    lastPostTime = millis();

    // In a real application, these variables would come from your LoRa radio 
    // (e.g. LoRa.parsePacket(), RadioLib, or Meshtastic serial output)
    sendEmergencyMeshTelemetry();
  }
}

// ---------------------- WI-FI CONNECTION ---------------------------
void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 25) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Failed to connect. Will retry...");
  }
}

// ---------------------- HTTPS POST REQUEST -------------------------
void sendEmergencyMeshTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi not connected. Skipping upload.");
    return;
  }

  // 1. Build the JSON Payload matching your exact keys:
  // - number_of_node
  // - node_location (array of nodes with lat, lng, battery, etc.)
  // - pending_help_message (array of SOS victim requests)
  // - dispatch_hoise_kina ("no" / "yes" / "in_transit" / "resolved")
  // - of different string (telemetry, frequency, status strings)

  // -------------------------------------------------------------
  // Dynamic LoRa Mesh Data - 3 Nodes Setup
  // -------------------------------------------------------------
  int nodeCount = 3;

  // Node 1: Master Gateway (at EOC / Base Station)
  float gwLat = 23.0159;
  float gwLng = 91.3976;
  int gwBattery = 100;
  int gwRssi = -45;

  // Node 2: Mesh Relay Node (Intermediate Tower / Bridge)
  float rlyLat = 23.0489;
  float rlyLng = 91.4251;
  int rlyBattery = 85;
  int rlyRssi = -76;

  // Node 3: Field Emergency SOS Node (Victim Location)
  float victimLat = 23.0722;
  float victimLng = 91.4650;
  int victimBattery = 38;
  int victimRssi = -98;
  const char* victimName = "Rahim Uddin (Family of 5)";
  const char* victimMsg  = "Water reached chest level, 5 members trapped on rooftop, need rescue boat";
  const char* dispatchStatus = "no"; // "no" = PENDING, "yes" = DISPATCHED

  // Build JSON String for 3 nodes
  String jsonPayload = "{";
  jsonPayload += "\"number_of_node\":" + String(nodeCount) + ",";
  
  // 3 Nodes Location Array
  jsonPayload += "\"node_location\":[";
  jsonPayload += "{\"node_id\":\"GW-01\",\"name\":\"Node 1 - EOC Master Gateway\",\"role\":\"GATEWAY\",\"latitude\":" + String(gwLat, 4) + ",\"longitude\":" + String(gwLng, 4) + ",\"battery_percentage\":" + String(gwBattery) + ",\"rssi\":" + String(gwRssi) + ",\"status\":\"ONLINE\"},";
  jsonPayload += "{\"node_id\":\"RLY-02\",\"name\":\"Node 2 - Mesh Relay Station\",\"role\":\"RELAY\",\"latitude\":" + String(rlyLat, 4) + ",\"longitude\":" + String(rlyLng, 4) + ",\"battery_percentage\":" + String(rlyBattery) + ",\"rssi\":" + String(rlyRssi) + ",\"status\":\"ONLINE\"},";
  jsonPayload += "{\"node_id\":\"SOS-03\",\"name\":\"Node 3 - Field Emergency Beacon\",\"role\":\"CLIENT_NODE\",\"latitude\":" + String(victimLat, 4) + ",\"longitude\":" + String(victimLng, 4) + ",\"battery_percentage\":" + String(victimBattery) + ",\"rssi\":" + String(victimRssi) + ",\"status\":\"SOS\"}";
  jsonPayload += "],";

  // Pending Help Messages Array ("dispatch hoise kina")
  jsonPayload += "\"pending_help_message\":[";
  jsonPayload += "{";
  jsonPayload += "\"request_id\":\"SOS-301\",";
  jsonPayload += "\"node_id\":\"SOS-03\",";
  jsonPayload += "\"victim_name\":\"" + String(victimName) + "\",";
  jsonPayload += "\"location_name\":\"Muhuri Basin, Ward 3\",";
  jsonPayload += "\"latitude\":" + String(victimLat, 4) + ",";
  jsonPayload += "\"longitude\":" + String(victimLng, 4) + ",";
  jsonPayload += "\"urgency\":\"CRITICAL\",";
  jsonPayload += "\"message\":\"" + String(victimMsg) + "\",";
  jsonPayload += "\"needed_resources\":[\"Rescue Boat\",\"Oxygen Cylinder\",\"Drinking Water\"],";
  jsonPayload += "\"dispatch_hoise_kina\":\"" + String(dispatchStatus) + "\"";
  jsonPayload += "}";
  jsonPayload += "]";
  jsonPayload += "}";

  Serial.println("\n[HTTP] Sending payload to: " + String(serverUrl));
  Serial.println("[HTTP] JSON Payload:");
  Serial.println(jsonPayload);

  // 2. Initialize Secure WiFi Client for HTTPS (Port 443)
  WiFiClientSecure client;
  
  // Vercel uses standard SSL/TLS. setInsecure() allows the ESP32 to establish
  // the HTTPS handshake without maintaining hardcoded root certificates that expire.
  client.setInsecure();

  HTTPClient https;
  if (https.begin(client, serverUrl)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("User-Agent", "ESP32-LoRa-Gateway/1.0");

    int httpResponseCode = https.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("[HTTP] Response code: ");
      Serial.println(httpResponseCode);

      String responseBody = https.getString();
      Serial.println("[HTTP] Server Response:");
      Serial.println(responseBody);
    } else {
      Serial.print("[HTTP] POST Failed. Error: ");
      Serial.println(https.errorToString(httpResponseCode).c_str());
    }

    https.end();
  } else {
    Serial.println("[HTTP] Unable to connect to HTTPS host");
  }
}
