const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');
require('dotenv').config();

// === CONFIGURATION ===
// Railway utilise PORT, mais on peut aussi utiliser WS_PORT
const WS_PORT = process.env.PORT || process.env.WS_PORT || 4001;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SECRET_TOKEN = process.env.IOT_WS_TOKEN || 'TON_TOKEN_SECRET';

// === CLASSES ET STRUCTURES ===
class IoTClient {
  constructor(ws, req, mac) {
    this.ws = ws;
    this.req = req;
    this.mac = mac;
    this.connectedAt = new Date();
    this.lastPing = new Date();
    this.messageCount = 0;
    this.isAuthenticated = false;
    this.lastHeartbeat = Date.now();
    this.isAlive = true;
    this.pingSent = false;
    this.pingTimeout = null;
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error(`❌ Erreur envoi message à ${this.mac}:`, error.message);
      }
    }
  }

  getInfo() {
    return {
      mac: this.mac,
      connectedAt: this.connectedAt,
      lastPing: this.lastPing,
      messageCount: this.messageCount,
      isAuthenticated: this.isAuthenticated,
      ip: this.req.socket.remoteAddress
    };
  }

  ping() {
    if (this.pingSent) {
      // Si un ping est déjà en cours, considérer le device comme offline
      console.log(`💔 IoT ${this.mac} n'a pas répondu au ping précédent, marqué comme offline`);
      this.isAlive = false;
      return;
    }

    this.pingSent = true;
    this.send({ type: 'ping', timestamp: Date.now() });
    
    // Définir un timeout pour le pong
    this.pingTimeout = setTimeout(() => {
      if (this.pingSent) {
        console.log(`💔 IoT ${this.mac} n'a pas répondu au ping dans les 10 secondes, marqué comme offline`);
        this.isAlive = false;
        this.pingSent = false;
      }
    }, 10000); // 10 secondes de timeout
  }

  updateHeartbeat() {
    this.lastHeartbeat = Date.now();
    this.isAlive = true;
    
    // Si un pong est reçu, annuler le timeout
    if (this.pingSent) {
      this.pingSent = false;
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
      }
    }
  }
}

class WebSocketManager {
  constructor() {
    this.clients = new Map(); // Map<mac, IoTClient>
    this.webClients = new Set(); // Clients web (interface utilisateur)
    this.server = null;
    this.heartbeatInterval = null;
    this.statusCheckInterval = null;
  }

  // Initialisation du serveur
  init() {
    const server = http.createServer();
    this.server = new WebSocket.Server({ server });
    
    this.server.on('connection', this.handleConnection.bind(this));
    
    server.listen(WS_PORT, '0.0.0.0', () => {
      console.log(`🚀 WebSocket Server démarré sur port ${WS_PORT}`);
      console.log(`🔐 Token de sécurité: ${SECRET_TOKEN.substring(0, 8)}...`);
      console.log(`📡 Prêt à recevoir les données IoT`);
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`🌐 URL publique: wss://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      }
    });

    // Démarrer le système de heartbeat
    this.startHeartbeatSystem();
    
    // Démarrer la vérification périodique des statuts
    this.startStatusCheckSystem();

    console.log(`✅ Système de monitoring IoT activé`);
  }

  // Gestion des nouvelles connexions
  handleConnection(ws, req) {
    console.log(`📡 Nouvelle connexion WebSocket depuis ${req.socket.remoteAddress}`);
    
    // Gestion des erreurs WebSocket
    ws.on('error', (error) => {
      console.log(`❌ Erreur WebSocket: ${error.message}`);
    });
    
    // Extraction du token et MAC depuis l'URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const mac = url.searchParams.get('mac');
    const clientType = url.searchParams.get('type');

    console.log(`🔍 Paramètres de connexion:`, {
      token: token ? 'Présent' : 'Manquant',
      mac: mac || 'Manquante',
      clientType: clientType || 'iot',
      ip: req.socket.remoteAddress
    });

    // Vérification du token
    if (!token || token !== SECRET_TOKEN) {
      console.log(`❌ Connexion refusée - Token invalide: ${token}`);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Token invalide ou manquant',
        code: 'AUTH_ERROR'
      }));
      ws.close(1008, 'Token invalide');
      return;
    }

    // Gestion des clients web (interface utilisateur)
    if (clientType === 'web') {
      console.log(`🌐 Client web connecté`);
      this.webClients.add(ws);
      
      // Envoyer les statuts actuels
      this.sendCurrentStatusToWebClient(ws);
      
      ws.on('close', () => {
        console.log(`🌐 Client web déconnecté`);
        this.webClients.delete(ws);
      });
      
    return;
  }

    // Gestion des IoT devices
    if (!mac) {
      console.log('❌ Connexion refusée - MAC manquante');
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Adresse MAC requise',
        code: 'MAC_MISSING'
      }));
      ws.close(1008, 'MAC manquante');
    return;
  }

    console.log(`📱 IoT connecté avec succès: ${mac}`);
    const client = new IoTClient(ws, req, mac);
    this.clients.set(mac, client);

    // Gérer l'IoT device dans la base de données (création automatique si nécessaire)
    this.handleIoTDevice(mac, req.socket.remoteAddress);

    // Message de bienvenue
    client.send({
      type: 'welcome',
      message: 'IoT connecté avec succès',
      mac: mac,
      timestamp: new Date().toISOString()
    });

    // Notifier les clients web
    this.notifyWebClients('iot_connected', { mac, ip: req.socket.remoteAddress });

    // Gestion des messages IoT
    ws.on('message', async (message) => {
      await this.handleIoTMessage(client, message);
    });

    ws.on('close', () => {
      console.log(`📱 IoT déconnecté: ${mac}`);
      this.clients.delete(mac);
      // Mettre à jour le statut offline
      this.updateIoTDeviceStatus(mac, 'offline');
      // Notifier les clients web
      this.notifyWebClients('iot_disconnected', { mac });
    });
  }

  // Gérer l'IoT device dans la base de données
  async handleIoTDevice(mac, ipAddress) {
    try {
      console.log(`📱 Gestion IoT device: ${mac} depuis ${ipAddress}`);
      
      // Vérifier si l'appareil existe déjà
      const existingDevice = await axios.get(`${API_BASE_URL}/api/iot/devices?mac=${mac}`);
      
      if (existingDevice.data && existingDevice.data.length > 0) {
        // Mettre à jour l'appareil existant
        const device = existingDevice.data[0];
        await axios.put(`${API_BASE_URL}/api/iot/devices/${device._id}`, {
          status: 'online',
          lastSeen: new Date().toISOString(),
          ipAddress: ipAddress,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ IoT device mis à jour: ${mac} (ID: ${device._id})`);
      } else {
        // Créer automatiquement un nouvel appareil
        const newDeviceData = {
          mac: mac,
          nom: `Capteur ${mac.substring(-6)}`, // Utilise les 6 derniers caractères de la MAC
          type: 'sensor', // Par défaut un capteur
          status: 'online',
          ipAddress: ipAddress,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const createResponse = await axios.post(`${API_BASE_URL}/api/iot/devices`, newDeviceData);
        
        if (createResponse.data && createResponse.data.success) {
          console.log(`✅ Nouvel IoT device créé automatiquement:`, {
            mac: mac,
            nom: newDeviceData.nom,
            id: createResponse.data.device.id
          });
        } else {
          console.error(`❌ Erreur création IoT device: ${mac}`, createResponse.data);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur gestion IoT device ${mac}:`, error.response?.data || error.message);
      
      // En cas d'erreur, on continue quand même pour ne pas bloquer la connexion WebSocket
      console.log(`⚠️ Connexion WebSocket maintenue malgré l'erreur de gestion IoT device`);
    }
  }

  // Envoyer les statuts actuels à un client web
  async sendCurrentStatusToWebClient(ws) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/iot/status`);
      const statusData = response.data;
      
      ws.send(JSON.stringify({
        type: 'iot_status_snapshot',
        data: statusData,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📊 Statuts IoT envoyés au client web`);
    } catch (error) {
      console.error(`❌ Erreur envoi statuts au client web:`, error.message);
    }
  }

  // Mettre à jour le statut d'un IoT device
  async updateIoTDeviceStatus(mac, status) {
    try {
      console.log(`📱 Mise à jour statut IoT device: ${mac} -> ${status}`);
      
      const existingDevice = await axios.get(`${API_BASE_URL}/api/iot/devices?mac=${mac}`);
      
      if (existingDevice.data && existingDevice.data.length > 0) {
        const device = existingDevice.data[0];
        const updateResponse = await axios.put(`${API_BASE_URL}/api/iot/devices/${device._id}`, {
          status: status,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        if (updateResponse.data && updateResponse.data.success) {
          console.log(`✅ Statut IoT device mis à jour: ${mac} -> ${status} (ID: ${device._id})`);
          
          // Notifier les clients web du changement de statut
          this.notifyWebClients('iot_status_changed', {
            mac: mac,
            status: status,
            deviceId: device._id,
            lastSeen: new Date().toISOString()
          });
        } else {
          console.error(`❌ Erreur mise à jour statut IoT device: ${mac}`, updateResponse.data);
        }
      } else {
        console.log(`⚠️ IoT device non trouvé pour mise à jour statut: ${mac}`);
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour statut IoT device ${mac}:`, error.response?.data || error.message);
    }
  }

  // Gestion des messages IoT
  async handleIoTMessage(client, message) {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Message reçu de ${client.mac}:`, data.type);

      // Traitement des différents types de messages
      switch (data.type) {
        case 'pong':
          // Réponse au ping - mettre à jour le heartbeat
          client.updateHeartbeat();
          console.log(`💓 Heartbeat reçu de ${client.mac}`);
          break;

        case 'heartbeat':
          // Heartbeat périodique du device
          client.updateHeartbeat();
          console.log(`💓 Heartbeat périodique de ${client.mac}`);
          // Optionnel: envoyer une confirmation
          client.send({ type: 'heartbeat_ack', success: true });
          break;

        case 'mesure':
          // Mettre à jour le heartbeat lors d'une mesure
          client.updateHeartbeat();
          
          // Valider et sauvegarder la mesure
          if (this.validateMesureData(data)) {
            await this.saveMesure(client.mac, data);
            client.send({ type: 'mesure_ack', success: true });
          } else {
            client.send({ type: 'mesure_ack', success: false, error: 'Données invalides' });
          }
          break;

        case 'status':
          // Mise à jour du statut du device
          client.updateHeartbeat();
          await this.updateIoTDeviceStatus(client.mac, data.status || 'online');
          client.send({ type: 'status_ack', success: true });
          break;

        case 'hello':
          // Message de bienvenue du device
          client.updateHeartbeat();
          client.send({ type: 'hello_ack', success: true });
          break;

        default:
          console.log(`❓ Type de message inconnu: ${data.type}`);
          console.log(`📄 Message complet:`, JSON.stringify(data, null, 2));
          client.send({ type: 'error', message: 'Type de message non reconnu' });
      }
    } catch (error) {
      console.error(`❌ Erreur traitement message de ${client.mac}:`, error.message);
      console.error(`📄 Message brut:`, message.toString());
      client.send({ type: 'error', message: 'Erreur de traitement' });
    }
  }

  // Validation des données de mesure
  validateMesureData(data) {
    // Champs requis avec support des noms français et anglais
    const fieldMappings = {
      'temperature': ['temperature'],
      'ph': ['ph'],
      'oxygen': ['oxygen', 'oxygene'],
      'salinity': ['salinity', 'salinite'],
      'turbidity': ['turbidity', 'turbidite']
    };
    
    for (const [englishField, possibleNames] of Object.entries(fieldMappings)) {
      let found = false;
      let value = null;
      
      // Chercher le champ avec n'importe quel nom possible
      for (const fieldName of possibleNames) {
        if (data.hasOwnProperty(fieldName)) {
          value = data[fieldName];
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(`❌ Champ manquant dans mesure: ${englishField} (noms attendus: ${possibleNames.join(', ')})`);
        return false;
      }
      
      if (typeof value !== 'number' || isNaN(value)) {
        console.log(`❌ Champ invalide dans mesure: ${englishField} = ${value}`);
        return false;
      }
    }
    
    return true;
  }

  // Sauvegarder une mesure
  async saveMesure(mac, data) {
    try {
      // Normaliser les données pour l'API Next.js (noms français)
      const mesureData = {
        mac: mac,
        temperature: data.temperature,
        ph: data.ph,
        oxygen: data.oxygen,
        salinity: data.salinity,
        turbidity: data.turbidity,
        timestamp: data.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      console.log(`📊 Mesure normalisée pour ${mac}:`, {
        temperature: mesureData.temperature,
        ph: mesureData.ph,
        oxygen: mesureData.oxygen,
        salinity: mesureData.salinity,
        turbidity: mesureData.turbidity
      });

      // Log la donnée envoyée à l'API (champs français)
      console.log(`📊 Mesure envoyée à l'API pour ${mac}:`, mesureData);

      const response = await axios.post(`${API_BASE_URL}/api/mesures`, mesureData);
      
      if (response.data && response.data.success) {
        console.log(`✅ Mesure sauvegardée pour ${mac}`);
      } else {
        console.error(`❌ Erreur sauvegarde mesure pour ${mac}:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Erreur sauvegarde mesure ${mac}:`, error.response?.data || error.message);
    }
  }

  // Système de heartbeat pour vérifier les connexions actives
  startHeartbeatSystem() {
    this.heartbeatInterval = setInterval(async () => {
      const now = Date.now();
      const HEARTBEAT_TIMEOUT = 60000; // 60 secondes

      for (const [mac, client] of this.clients) {
        // Vérifier si le device a répondu récemment
        if (now - client.lastHeartbeat > HEARTBEAT_TIMEOUT) {
          console.log(`💔 IoT ${mac} n'a pas répondu au heartbeat, marqué comme offline`);
          client.isAlive = false;
          await this.updateIoTDeviceStatus(mac, 'offline');
        } else if (!client.isAlive) {
          // Si le device était offline mais répond maintenant
          console.log(`✅ IoT ${mac} est de nouveau en ligne`);
          client.isAlive = true;
          await this.updateIoTDeviceStatus(mac, 'online');
        } else {
          // Envoyer un ping pour vérifier la connexion
          client.ping();
        }
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  // Système de vérification périodique des statuts
  startStatusCheckSystem() {
    this.statusCheckInterval = setInterval(async () => {
      try {
        console.log(`🔍 Vérification périodique des statuts IoT...`);
        
        // Récupérer tous les devices depuis la base de données
        const response = await axios.get(`${API_BASE_URL}/api/iot/devices`);
        const allDevices = response.data;

        // Vérifier chaque device
        for (const device of allDevices) {
          const isConnected = this.clients.has(device.mac) && 
                             this.clients.get(device.mac).isAlive;
          
          const currentStatus = device.status;
          const expectedStatus = isConnected ? 'online' : 'offline';

          // Mettre à jour le statut si nécessaire
          if (currentStatus !== expectedStatus) {
            console.log(`📱 Mise à jour statut IoT ${device.mac}: ${currentStatus} -> ${expectedStatus}`);
            await this.updateIoTDeviceStatus(device.mac, expectedStatus);
          }
        }

        console.log(`✅ Vérification des statuts terminée - ${allDevices.length} devices vérifiés`);
      } catch (error) {
        console.error(`❌ Erreur lors de la vérification des statuts:`, error.message);
      }
    }, 60000); // Vérifier toutes les minutes
  }

  // Arrêter les systèmes de monitoring
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    console.log(`🛑 Système de monitoring IoT arrêté`);
  }

  // Statistiques
  getStats() {
    return {
      iotCount: this.clients.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  // Notifier tous les clients web d'un changement de statut
  notifyWebClients(event, data) {
    const message = JSON.stringify({
      type: 'iot_status_update',
      event: event,
      data: data,
      timestamp: new Date().toISOString()
    });

    this.webClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// === DÉMARRAGE ===
const wsManager = new WebSocketManager();
wsManager.init();

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur WebSocket...');
  wsManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur WebSocket...');
  wsManager.stop();
  process.exit(0);
});

// Export pour les tests
module.exports = wsManager; 