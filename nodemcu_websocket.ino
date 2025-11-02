#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <WiFiManager.h>
#include <ArduinoOTA.h>

// === CONFIGURATION ===
const char* WS_SERVER = "192.168.103.206";
const uint16_t WS_PORT = 4001;
const char* WS_TOKEN = "TON_TOKEN_SECRET";

// === VARIABLES ===
WebSocketsClient webSocket;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);
bool wsConnected = false;
bool ntpSynced = false;
unsigned long lastSendTime = 0;
unsigned long lastConnectAttempt = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastPingResponse = 0;
int connectAttempts = 0;

// Gestion d'erreur avancée
int wifiFailCount = 0;
int wsFailCount = 0;
const int MAX_WIFI_FAILS = 10;
const int MAX_WS_FAILS = 10;

// Intervalles de temps
const unsigned long HEARTBEAT_INTERVAL = 30000;
const unsigned long MEASURE_INTERVAL = 30000;

// === WIFI (via WiFiManager) ===
void connectWiFi() {
  WiFiManager wifiManager;
  if (!wifiManager.autoConnect("AquaAI-Config")) {
    Serial.println(F("Echec config WiFi, reboot..."));
    delay(2000);
    ESP.restart();
  }
  Serial.println(F("WiFi OK"));
    Serial.print(F("IP: "));
    Serial.println(WiFi.localIP());
  wifiFailCount = 0;
}

// === NTP ===
void syncNTP() {
  if (!ntpSynced) {
    Serial.println(F("NTP sync..."));
    timeClient.update();
    if (timeClient.isTimeSet()) {
      ntpSynced = true;
      Serial.println(F("NTP OK"));
    } else {
      Serial.println(F("NTP failed"));
    }
  }
}

String getTimestamp() {
  if (!ntpSynced) return "";
  time_t rawTime = timeClient.getEpochTime();
  struct tm* ti = gmtime(&rawTime);
  char isoTime[25];
  strftime(isoTime, sizeof(isoTime), "%Y-%m-%dT%H:%M:%SZ", ti);
  return String(isoTime);
}

// === WEBSOCKET (SSL/TLS) ===
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println(F("[WS] Déconnecté"));
      wsConnected = false;
      wsFailCount++;
      if (wsFailCount > MAX_WS_FAILS) {
        Serial.println(F("Trop d'échecs WS, reboot..."));
        delay(2000);
        ESP.restart();
      }
      break;
    case WStype_CONNECTED:
      Serial.println(F("[WS] Connecté"));
      wsConnected = true;
      wsFailCount = 0;
      connectAttempts = 0;
      sendHello();
      break;
    case WStype_TEXT:
      handleWebSocketMessage(payload, length);
      break;
    case WStype_ERROR:
      Serial.println(F("[WS] Erreur"));
      wsConnected = false;
      wsFailCount++;
      if (wsFailCount > MAX_WS_FAILS) {
        Serial.println(F("Trop d'échecs WS, reboot..."));
        delay(2000);
        ESP.restart();
      }
      break;
    case WStype_PING:
      Serial.println(F("[WS] Ping reçu"));
      sendPong();
      break;
    case WStype_PONG:
      Serial.println(F("[WS] Pong reçu"));
      lastPingResponse = millis();
      break;
  }
}

void handleWebSocketMessage(uint8_t * payload, size_t length) {
  String message = String((char*)payload);
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.print(F("Erreur parsing JSON: "));
    Serial.println(error.c_str());
    return;
  }
  const char* type = doc["type"];
  if (strcmp(type, "ping") == 0) {
    sendPong();
    Serial.println(F("[WS] Ping traité"));
  } else if (strcmp(type, "welcome") == 0) {
    Serial.println(F("[WS] Message de bienvenue reçu"));
  } else if (strcmp(type, "mesure_ack") == 0) {
    bool success = doc["success"];
    if (success) Serial.println(F("[WS] Mesure confirmée"));
    else Serial.println(F("[WS] Erreur mesure"));
  } else if (strcmp(type, "error") == 0) {
    const char* errorMsg = doc["message"];
    Serial.print(F("[WS] Erreur serveur: "));
    Serial.println(errorMsg);
  } else if (strcmp(type, "hello_ack") == 0) {
    Serial.println(F("[WS] Hello confirmé"));
  } else if (strcmp(type, "status_ack") == 0) {
    Serial.println(F("[WS] Statut confirmé"));
  } else {
    Serial.print(F("[WS] Type de message inconnu: "));
    Serial.println(type);
  }
}

void connectWebSocket() {
  if (!wsConnected && WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastConnectAttempt > 5000) {
      lastConnectAttempt = now;
      connectAttempts++;
      Serial.print(F("WS connect... (tentative "));
      Serial.print(connectAttempts);
      Serial.println(F(")"));
      char path[64];
      snprintf(path, sizeof(path), "/?token=%s&mac=%s", WS_TOKEN, WiFi.macAddress().c_str());
      Serial.print(F("Path: "));
      Serial.println(path);
      webSocket.beginSSL(WS_SERVER, WS_PORT, path);
      webSocket.onEvent(webSocketEvent);
      webSocket.setReconnectInterval(5000);
      webSocket.setInsecure();
    }
  }
}

// === ENVOI MESSAGES ===
void sendHello() {
  DynamicJsonDocument doc(256);
  doc["type"] = "hello";
  doc["mac"] = WiFi.macAddress();
  doc["timestamp"] = getTimestamp();
  doc["version"] = "1.0";
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.println(F("[WS] Hello envoyé"));
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["mac"] = WiFi.macAddress();
  doc["timestamp"] = getTimestamp();
  doc["uptime"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.println(F("[WS] Heartbeat envoyé"));
}

void sendPong() {
  DynamicJsonDocument doc(256);
  doc["type"] = "pong";
  doc["mac"] = WiFi.macAddress();
  doc["timestamp"] = getTimestamp();
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.println(F("[WS] Pong envoyé"));
}

void sendStatus() {
  DynamicJsonDocument doc(256);
  doc["type"] = "status";
  doc["mac"] = WiFi.macAddress();
  doc["status"] = "online";
  doc["timestamp"] = getTimestamp();
  doc["uptime"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  Serial.println(F("[WS] Statut envoyé"));
}

// === ENVOI DONNÉES ===
void sendData() {
  if (!wsConnected) return;
  float temperature = random(200, 300) / 10.0;
  float ph = random(60, 80) / 10.0;
  float oxygen = random(50, 100) / 10.0;
  float salinity = random(100, 250) / 10.0;
  float turbidity = random(10, 100) / 10.0;
  DynamicJsonDocument doc(512);
  doc["type"] = "mesure";
  doc["mac"] = WiFi.macAddress();
  doc["temperature"] = temperature;
  doc["ph"] = ph;
  doc["oxygen"] = oxygen;
  doc["salinity"] = salinity;
  doc["turbidity"] = turbidity;
  doc["timestamp"] = getTimestamp();
  String jsonString;
  serializeJson(doc, jsonString);
  if (webSocket.sendTXT(jsonString)) {
    Serial.print(F("Data sent: "));
    Serial.print(temperature, 1); Serial.print(F("°C "));
    Serial.print(ph, 1); Serial.print(F("pH "));
    Serial.print(oxygen, 1); Serial.print(F("O2 "));
    Serial.print(salinity, 1); Serial.print(F("S "));
    Serial.print(turbidity, 1); Serial.println(F("T"));
  }
}

void logStatus() {
  Serial.println(F("=== Status Log ==="));
  Serial.print(F("Uptime: ")); Serial.print(millis() / 1000); Serial.println(F("s"));
  Serial.print(F("Free Heap: ")); Serial.print(ESP.getFreeHeap()); Serial.println(F(" bytes"));
  Serial.print(F("WiFi RSSI: ")); Serial.print(WiFi.RSSI()); Serial.println(F(" dBm"));
  Serial.print(F("WebSocket: ")); Serial.println(wsConnected ? F("Connecté") : F("Déconnecté"));
  Serial.print(F("NTP: ")); Serial.println(ntpSynced ? F("Sync") : F("Non sync"));
  Serial.println(F("=================="));
}

// === SETUP ===
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n=== AQUAAI START ==="));
  connectWiFi();
  timeClient.begin();
  timeClient.setTimeOffset(0);
  syncNTP();
  ArduinoOTA.begin();
  connectWebSocket();
  Serial.println(F("=== READY ==="));
}

// === LOOP ===
void loop() {
  ArduinoOTA.handle();
  if (WiFi.status() == WL_CONNECTED && !ntpSynced) syncNTP();
  webSocket.loop();
  if (!wsConnected && WiFi.status() == WL_CONNECTED) connectWebSocket();
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    if (wsConnected) sendHeartbeat();
  }
  if (millis() - lastSendTime > MEASURE_INTERVAL) {
    lastSendTime = millis();
    if (wsConnected) sendData();
  }
  static unsigned long lastLog = 0;
  if (millis() - lastLog > 60000) {
    lastLog = millis();
    logStatus();
  }
  delay(100);
  yield();
} 