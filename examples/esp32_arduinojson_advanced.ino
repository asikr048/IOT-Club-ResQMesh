/*
 * ======================================================================================
 * ESP32 LoRa Mesh Gateway -> HTTPS Ingestion (ArduinoJson v7 / v6 Version)
 * ======================================================================================
 * 
 * Install Library via Arduino Library Manager:
 * - "ArduinoJson" by Benoît Blanchon (version 6.x or 7.x)
 * 
 * Target Endpoint:
 * - https://your-project.vercel.app/api/mesh-data
 * ======================================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Configuration
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Vercel Server HTTPS Endpoint
const char* serverUrl = "https://your-project.vercel.app/api/mesh-data";

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    sendMeshTelemetryJson();
  }
  delay(15000); // Send every 15 seconds
}

void sendMeshTelemetryJson() {
  // Create JSON Document
  JsonDocument doc; // ArduinoJson v7 syntax (or DynamicJsonDocument doc(2048) for v6)

  // 1. Number of Nodes
  doc["number_of_node"] = 3;

  // 2. Node Locations
  JsonArray nodes = doc["node_location"].to<JsonArray>();
  
  JsonObject node1 = nodes.add<JsonObject>();
  node1["node_id"] = "GW-01";
  node1["name"] = "ESP32 LoRa Master Gateway";
  node1["role"] = "GATEWAY";
  node1["latitude"] = 23.0159;
  node1["longitude"] = 91.3976;
  node1["battery_percentage"] = 99;
  node1["rssi"] = -48;
  node1["snr"] = 11.5;
  node1["status"] = "ONLINE";

  JsonObject node2 = nodes.add<JsonObject>();
  node2["node_id"] = "SOS-NODE-03";
  node2["name"] = "Chhagalnaiya Relief Camp";
  node2["role"] = "CLIENT_NODE";
  node2["latitude"] = 23.0360;
  node2["longitude"] = 91.5120;
  node2["battery_percentage"] = 38;
  node2["rssi"] = -102;
  node2["snr"] = -2.1;
  node2["status"] = "SOS";

  // 3. Pending Help Messages ("dispatch hoise kina")
  JsonArray helpRequests = doc["pending_help_message"].to<JsonArray>();
  JsonObject sos = helpRequests.add<JsonObject>();
  sos["request_id"] = "SOS-ESP-101";
  sos["node_id"] = "SOS-NODE-03";
  sos["victim_name"] = "Fatema Begum (Family of 4)";
  sos["location_name"] = "Chhagalnaiya Ward 3, High School Shelter";
  sos["latitude"] = 23.0360;
  sos["longitude"] = 91.5120;
  sos["urgency"] = "CRITICAL";
  sos["message"] = "Drinking water exhausted, infant needs milk and dry food";
  
  JsonArray resources = sos["needed_resources"].to<JsonArray>();
  resources.add("Drinking Water");
  resources.add("Baby Formula");
  resources.add("Dry Rations");

  // "dispatch hoise kina": "no" = PENDING, "yes" = DISPATCHED
  sos["dispatch_hoise_kina"] = "no";

  // Serialize to String
  String jsonOutput;
  serializeJson(doc, jsonOutput);

  // Send HTTPS POST
  WiFiClientSecure client;
  client.setInsecure(); // Bypass root cert expiry for Vercel SSL

  HTTPClient https;
  if (https.begin(client, serverUrl)) {
    https.addHeader("Content-Type", "application/json");

    int httpCode = https.POST(jsonOutput);
    if (httpCode > 0) {
      Serial.printf("[HTTPS] Response: %d\n", httpCode);
      Serial.println(https.getString());
    } else {
      Serial.printf("[HTTPS] Error: %s\n", https.errorToString(httpCode).c_str());
    }
    https.end();
  }
}
