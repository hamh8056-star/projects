# Documentation WebSocket et API - AquaAI

## Vue d'ensemble

Cette documentation décrit l'architecture WebSocket et API reformulée pour le système AquaAI, offrant une communication robuste entre les capteurs IoT (NodeMCU) et le serveur de données.

## Architecture

### Composants principaux

1. **Serveur WebSocket** (`server/ws-server.js`)
   - Gestion des connexions IoT et dashboards
   - Validation des tokens de sécurité
   - Diffusion des données en temps réel
   - Gestion des reconnexions automatiques

2. **API REST** (`src/app/api/`)
   - `/api/mesures` - Gestion des mesures de capteurs
   - `/api/iot/status` - Statut des dispositifs IoT
   - Validation et stockage des données

3. **Client NodeMCU** (`nodemcu_websocket.ino`)
   - Connexion WiFi et WebSocket robuste
   - Lecture des capteurs et envoi des données
   - Gestion des reconnexions et erreurs
   - Configuration stockée en EEPROM

## Protocole de communication

### Types de messages

#### Messages IoT → Serveur

**Hello Message**
```json
{
  "type": "hello",
  "mac": "A4:CF:12:34:56:78",
  "deviceName": "Capteur AquaAI",
  "deviceType": "multi-sensor",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Mesure Message**
```json
{
  "type": "mesure",
  "mac": "A4:CF:12:34:56:78",
  "temperature": 25.5,
  "ph": 7.2,
  "oxygene": 8.5,
  "salinite": 15.3,
  "turbidite": 2.1,
  "timestamp": "2024-01-15T10:30:00Z",
  "messageId": 123
}
```

**Status Message**
```json
{
  "type": "status",
  "mac": "A4:CF:12:34:56:78",
  "deviceName": "Capteur AquaAI",
  "deviceType": "multi-sensor",
  "wifiConnected": true,
  "wsConnected": true,
  "ntpSynced": true,
  "uptime": 3600000,
  "messageCount": 120,
  "reconnectCount": 2,
  "errorCount": 0,
  "freeHeap": 25000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Messages Serveur → IoT

**Hello Acknowledgment**
```json
{
  "type": "hello_ack",
  "message": "Hello reçu",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Mesure Acknowledgment**
```json
{
  "type": "mesure_ack",
  "message": "Mesure enregistrée",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Command Message**
```json
{
  "type": "command",
  "command": "restart",
  "params": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Ping Message**
```json
{
  "type": "ping",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Messages Dashboard ↔ Serveur

**Dashboard Connection**
```
ws://localhost:4001/?token=TON_SECRET_TOKEN&type=dashboard
```

**Get Status**
```json
{
  "type": "get_status"
}
```

**Send Command**
```json
{
  "type": "command",
  "targetMac": "A4:CF:12:34:56:78",
  "command": "restart",
  "params": {}
}
```

## Configuration

### Variables d'environnement

```bash
# Serveur WebSocket
WS_PORT=4001
API_BASE_URL=http://localhost:3000
IOT_WS_TOKEN=TON_SECRET_TOKEN

# NodeMCU
WIFI_SSID=your_wifi_ssid
WIFI_PASSWORD=your_wifi_password
WS_SERVER=192.168.1.100
WS_PORT=4001
WS_TOKEN=AQUAAI_SECRET_TOKEN
```

### Configuration NodeMCU

Le NodeMCU stocke sa configuration en EEPROM :

```cpp
struct SensorConfig {
  char deviceName[32];        // Nom du dispositif
  char deviceType[16];        // Type de capteur
  float calibrationOffset[5]; // Offsets de calibration
  bool enabled;               // État d'activation
};
```

## API REST

### POST /api/mesures

**Request Body:**
```json
{
  "mac": "A4:CF:12:34:56:78",
  "temperature": 25.5,
  "ph": 7.2,
  "oxygene": 8.5,
  "salinite": 15.3,
  "turbidite": 2.1,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mesure créée avec succès",
  "insertedId": "507f1f77bcf86cd799439011",
  "mesure": {
    "id": "507f1f77bcf86cd799439011",
    "mac": "A4:CF:12:34:56:78",
    "bassinId": "bassin_123",
    "bassinNom": "Bassin Principal",
    "timestamp": "2024-01-15T10:30:00Z",
    "values": {
      "temperature": 25.5,
      "ph": 7.2,
      "oxygene": 8.5,
      "salinite": 15.3,
      "turbidite": 2.1
    }
  }
}
```

### GET /api/mesures

**Query Parameters:**
- `bassinId` - Filtrer par bassin
- `mac` - Filtrer par adresse MAC
- `limit` - Nombre de résultats (défaut: 100)
- `offset` - Pagination (défaut: 0)
- `startDate` - Date de début (ISO)
- `endDate` - Date de fin (ISO)

**Response:**
```json
{
  "mesures": [...],
  "total": 150,
  "limit": 100,
  "offset": 0,
  "hasMore": true
}
```

### POST /api/iot/status

**Request Body:**
```json
{
  "mac": "A4:CF:12:34:56:78",
  "status": "online",
  "lastSeen": "2024-01-15T10:30:00Z"
}
```

### GET /api/iot/status

**Response:**
```json
{
  "devices": [
    {
      "_id": "iot_123",
      "nom": "Capteur AquaAI",
      "mac": "A4:CF:12:34:56:78",
      "type": "capteur",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00Z",
      "bassinId": "bassin_123",
      "isOnline": true,
      "timeSinceLastSeen": 30
    }
  ],
  "total": 5,
  "online": 3,
  "offline": 2
}
```

## Gestion des erreurs

### Codes d'erreur WebSocket

- `AUTH_ERROR` - Token invalide ou manquant
- `MAC_MISSING` - Adresse MAC requise
- `INVALID_DATA` - Données invalides
- `PROCESSING_ERROR` - Erreur de traitement
- `SAVE_ERROR` - Erreur de sauvegarde
- `IOT_NOT_FOUND` - IoT non trouvé

### Codes d'erreur API

- `SENSOR_NOT_FOUND` - Capteur non reconnu
- `SENSOR_NOT_ASSIGNED` - Capteur non associé à un bassin

## Sécurité

### Authentification

- Token de sécurité requis pour toutes les connexions WebSocket
- Validation côté serveur de tous les messages
- Limitation du nombre de tentatives de reconnexion

### Validation des données

- Validation des plages de valeurs pour chaque paramètre
- Vérification des timestamps
- Sanitisation des entrées

## Monitoring et logs

### Logs serveur

Le serveur WebSocket génère des logs détaillés :

```
🚀 WebSocket Server démarré sur ws://localhost:4001
🔐 Token de sécurité: AQUAAI_S...
📡 Nouvelle connexion depuis 192.168.1.100
📱 IoT connecté: A4:CF:12:34:56:78
👋 Hello de A4:CF:12:34:56:78
📊 Mesure reçue de A4:CF:12:34:56:78: {temperature: 25.5, ph: 7.2, ...}
✅ Mesure enregistrée: {id: "507f1f77bcf86cd799439011", mac: "A4:CF:12:34:56:78", ...}
```

### Logs NodeMCU

Le NodeMCU affiche des informations de statut :

```
=== DÉMARRAGE CAPTEUR AQUAAI ===
Configuration chargée: Capteur AquaAI (multi-sensor)
WiFi connecté !
IP: 192.168.1.100
MAC: A4:CF:12:34:56:78
NTP synchronisé: 2024-01-15T10:30:00Z
=== CONFIGURATION TERMINÉE ===
[WebSocket] Connecté !
Message hello envoyé: {"type":"hello","mac":"A4:CF:12:34:56:78",...}
Mesure envoyée (ID: 1): T=25.5°C, pH=7.2, O2=8.5mg/L, S=15.3ppt, T=2.1NTU
```

## Déploiement

### Serveur WebSocket

```bash
# Installation des dépendances
npm install ws axios dotenv

# Démarrage du serveur
node server/ws-server.js
```

### Application Next.js

```bash
# Démarrage en mode développement
npm run dev

# Démarrage en mode production
npm run build
npm start
```

### NodeMCU

1. Installer les bibliothèques requises dans l'IDE Arduino
2. Configurer les paramètres WiFi et serveur
3. Compiler et téléverser le code
4. Vérifier les logs série pour confirmer la connexion

## Maintenance

### Nettoyage des données

- Les connexions mortes sont automatiquement nettoyées
- Les mesures sont conservées selon la politique de rétention
- Les logs sont rotatifs pour éviter la saturation

### Monitoring

- Surveillance des connexions actives
- Compteurs de messages et erreurs
- Alertes en cas de déconnexion prolongée

## Support

Pour toute question ou problème :

1. Vérifier les logs du serveur WebSocket
2. Contrôler les logs série du NodeMCU
3. Tester la connectivité réseau
4. Valider la configuration des tokens 