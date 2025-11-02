/**
 * Script de test pour simuler l'envoi de données IoT
 * 
 * Ce script permet de générer des données simulées pour les capteurs IoT
 * et de les envoyer à l'API REST pour tester l'affichage des mesures
 * dans l'interface de traçabilité.
 * 
 * Utilisation: node scripts/test-iot-data.js <mac_address> <bassin_id>
 */

const fetch = require('node-fetch');

// Paramètres par défaut
const DEFAULT_MAC = '00:11:22:33:44:55';
const DEFAULT_BASIN_ID = '685a4fc179766283be9b7f55'; // Remplacer par un ID de bassin valide

// Récupérer les paramètres de ligne de commande
const args = process.argv.slice(2);
const macAddress = args[0] || DEFAULT_MAC;
const bassinId = args[1] || DEFAULT_BASIN_ID;

// Générer des données aléatoires dans des plages réalistes
function generateRandomData() {
  return {
    mac: macAddress,
    temperature: (20 + Math.random() * 10).toFixed(1), // 20-30°C
    ph: (6.5 + Math.random() * 2).toFixed(1), // 6.5-8.5
    oxygen: (4 + Math.random() * 6).toFixed(1), // 4-10 mg/L
    salinity: (0 + Math.random() * 5).toFixed(1), // 0-5 ppt
    turbidity: (10 + Math.random() * 90).toFixed(1), // 10-100 NTU
    timestamp: new Date().toISOString()
  };
}

// Simuler des données pour les 30 derniers jours
async function simulateHistoricalData() {
  console.log('🔌 Simulation de données historiques pour les 30 derniers jours...');
  
  const baseUrl = 'http://localhost:3000/api/mesures';
  const now = new Date();
  
  // Enregistrer le capteur IoT s'il n'existe pas déjà
  try {
    const deviceResponse = await fetch('http://localhost:3000/api/iot/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mac: macAddress,
        nom: 'Capteur de test',
        type: 'multi-sensor',
        bassinId: bassinId,
        stade: 'grossissement'
      })
    });
    
    if (deviceResponse.ok) {
      console.log('✅ Capteur IoT enregistré avec succès');
    } else {
      console.log('⚠️ Le capteur existe probablement déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du capteur:', error);
  }
  
  // Générer des données pour les 30 derniers jours (une mesure par jour)
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const data = generateRandomData();
    data.timestamp = date.toISOString();
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log(`✅ Données envoyées pour ${date.toLocaleDateString()}`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Erreur lors de l'envoi des données pour ${date.toLocaleDateString()}:`, errorData);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi des données pour ${date.toLocaleDateString()}:`, error);
    }
    
    // Courte pause pour ne pas surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Simulation terminée !');
}

// Exécuter la simulation
simulateHistoricalData().catch(error => {
  console.error('❌ Erreur lors de la simulation:', error);
}); 