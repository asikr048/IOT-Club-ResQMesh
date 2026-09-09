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
  // Exact JSON Keys:
  // - node_id
  // - name
  // - latitude, longitude
  // - Rescue Needed ("yes" / "no")
  // - Resque Arrived ("yes" / "no")
  // - Medicine arrived ("yes" / "no")
  // - medicine disatched ("yes" / "no")
  // - aid required (["rescue boat", "oxygen cylinder", "drinking water", "first aid box"])
  // - dispatched ("yes" / "no") -> if "yes", automatically saved!
  // -------------------------------------------------------------

  // Node 1: Master Gateway (EOC Station)
  float gwLat = 23.0159;
  float gwLng = 91.3976;

  // Node 2: Mesh Relay Station
  float rlyLat = 23.0489;
  float rlyLng = 91.4251;

  // Node 3: Field Emergency SOS Node (Pending Request)
  float sosLat = 23.0722;
  float sosLng = 91.4650;
  const char* rescueNeeded = "yes";
  const char* resqueArrived = "no";
  const char* medicineArrived = "no";
  const char* medicineDispatched = "no";
  const char* dispatchedStatus = "no"; // "no" = PENDING, "yes" = SAVED / RESOLVED

  // Build JSON Array for 3 nodes
  String jsonPayload = "[";
  
  // Node 1: GW-01
  jsonPayload += "{";
  jsonPayload += "\"node_id\":\"GW-01\",";
  jsonPayload += "\"name\":\"Node GW-01\",";
  jsonPayload += "\"latitude\":" + String(gwLat, 4) + ",";
  jsonPayload += "\"longitude\":" + String(gwLng, 4) + ",";
  jsonPayload += "\"Rescue Needed\":\"no\",";
  jsonPayload += "\"Resque Arrived\":\"no\",";
  jsonPayload += "\"Medicine arrived\":\"no\",";
  jsonPayload += "\"medicine disatched\":\"no\",";
  jsonPayload += "\"aid required\":[],";
  jsonPayload += "\"dispatched\":\"no\"";
  jsonPayload += "},";

  // Node 2: RLY-02
  jsonPayload += "{";
  jsonPayload += "\"node_id\":\"RLY-02\",";
  jsonPayload += "\"name\":\"Node RLY-02\",";
  jsonPayload += "\"latitude\":" + String(rlyLat, 4) + ",";
  jsonPayload += "\"longitude\":" + String(rlyLng, 4) + ",";
  jsonPayload += "\"Rescue Needed\":\"no\",";
  jsonPayload += "\"Resque Arrived\":\"no\",";
  jsonPayload += "\"Medicine arrived\":\"no\",";
  jsonPayload += "\"medicine disatched\":\"no\",";
  jsonPayload += "\"aid required\":[],";
  jsonPayload += "\"dispatched\":\"no\"";
  jsonPayload += "},";

  // Node 3: SOS-03 (Emergency SOS Node)
  jsonPayload += "{";
  jsonPayload += "\"node_id\":\"SOS-03\",";
  jsonPayload += "\"name\":\"Node SOS-03\",";
  jsonPayload += "\"latitude\":" + String(sosLat, 4) + ",";
  jsonPayload += "\"longitude\":" + String(sosLng, 4) + ",";
  jsonPayload += "\"Rescue Needed\":\"" + String(rescueNeeded) + "\",";
  jsonPayload += "\"Resque Arrived\":\"" + String(resqueArrived) + "\",";
  jsonPayload += "\"Medicine arrived\":\"" + String(medicineArrived) + "\",";
  jsonPayload += "\"medicine disatched\":\"" + String(medicineDispatched) + "\",";
  jsonPayload += "\"aid required\":[\"rescue boat\",\"oxygen cylinder\",\"drinking water\",\"first aid box\"],";
  jsonPayload += "\"aid arrived\":[\"yes\",\"yes\",\"no\",\"no\"],";
  jsonPayload += "\"dispatched\":\"" + String(dispatchedStatus) + "\"";
  jsonPayload += "}";

  jsonPayload += "]";

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
