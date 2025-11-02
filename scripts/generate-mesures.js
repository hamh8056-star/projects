/**
 * Script pour générer des données de test pour les mesures environnementales
 * 
 * Usage: node scripts/generate-mesures.js <bassinId>
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquaai';
const DEFAULT_BASIN_ID = '685a4fc179766283be9b7f55'; // Remplacer par un ID de bassin valide

// Paramètres CLI
const args = process.argv.slice(2);
const bassinId = args[0] || DEFAULT_BASIN_ID;

// Vérifier si l'ID est valide
if (!ObjectId.isValid(bassinId)) {
  console.error('❌ ID de bassin invalide');
  process.exit(1);
}

// Générer des données aléatoires pour un jour spécifique
function generateDailyData(date, bassinInfo) {
  // Base pour les valeurs
  const baseValues = {
    temperature: 25, // 25°C
    ph: 7.2,         // pH 7.2
    oxygen: 6.5,     // 6.5 mg/L
    salinity: 2.0,   // 2.0 ppt
    turbidity: 25    // 25 NTU
  };
  
  // Fluctuations journalières (variation légère)
  const dailyVariation = {
    temperature: (Math.random() * 2) - 1, // ±1°C
    ph: (Math.random() * 0.4) - 0.2,      // ±0.2
    oxygen: (Math.random() * 1) - 0.5,    // ±0.5 mg/L
    salinity: (Math.random() * 0.6) - 0.3, // ±0.3 ppt
    turbidity: (Math.random() * 10) - 5    // ±5 NTU
  };
  
  // Fluctuations horaires (plus petites)
  const hourlyData = [];
  
  // Générer 4 points de mesure pour la journée (6h, 10h, 14h, 18h)
  [6, 10, 14, 18].forEach(hour => {
    const hourlyVariation = {
      temperature: (Math.random() * 0.6) - 0.3, // ±0.3°C
      ph: (Math.random() * 0.2) - 0.1,          // ±0.1
      oxygen: (Math.random() * 0.4) - 0.2,      // ±0.2 mg/L
      salinity: (Math.random() * 0.2) - 0.1,    // ±0.1 ppt
      turbidity: (Math.random() * 4) - 2        // ±2 NTU
    };
    
    const measureDate = new Date(date);
    measureDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    hourlyData.push({
      bassinId: bassinId,
      bassinNom: bassinInfo?.nom || 'Bassin test',
      date: measureDate,
      createdAt: new Date(),
      mac: '00:11:22:33:44:55',
      temperature: parseFloat((baseValues.temperature + dailyVariation.temperature + hourlyVariation.temperature).toFixed(1)),
      ph: parseFloat((baseValues.ph + dailyVariation.ph + hourlyVariation.ph).toFixed(1)),
      oxygen: parseFloat((baseValues.oxygen + dailyVariation.oxygen + hourlyVariation.oxygen).toFixed(1)),
      salinity: parseFloat((baseValues.salinity + dailyVariation.salinity + hourlyVariation.salinity).toFixed(1)),
      turbidity: parseFloat((baseValues.turbidity + dailyVariation.turbidity + hourlyVariation.turbidity).toFixed(1))
    });
  });
  
  return hourlyData;
}

// Connexion à MongoDB et génération des données
async function generateAndSaveMesures() {
  console.log(`🔌 Génération de données pour le bassin ${bassinId}...`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Vérifier si le bassin existe
    const bassin = await db.collection('bassins').findOne({ _id: new ObjectId(bassinId) });
    
    if (!bassin) {
      console.log(`⚠️ Attention: Le bassin ${bassinId} n'existe pas dans la base de données`);
    } else {
      console.log(`ℹ️ Génération de données pour le bassin: ${bassin.nom}`);
    }
    
    // Supprimer les anciennes mesures pour ce bassin (optionnel)
    const deleteResult = await db.collection('mesures').deleteMany({ bassinId: bassinId });
    console.log(`🗑️ ${deleteResult.deletedCount} anciennes mesures supprimées`);
    
    // Générer des données pour les 30 derniers jours
    const mesures = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dailyData = generateDailyData(date, bassin);
      mesures.push(...dailyData);
    }
    
    // Insérer les données dans MongoDB
    const insertResult = await db.collection('mesures').insertMany(mesures);
    console.log(`✅ ${insertResult.insertedCount} mesures insérées`);
    
    // Obtenir le dernier lot associé à ce bassin
    const lot = await db.collection('lots').findOne(
      { bassinId: new ObjectId(bassinId) },
      { sort: { dateCreation: -1 } }
    );
    
    if (lot) {
      console.log(`ℹ️ Lot associé trouvé: ${lot.nom} (${lot._id})`);
      console.log(`🔗 URL de traçabilité: http://localhost:3000/public/tracabilite/${lot._id}`);
    } else {
      console.log(`⚠️ Aucun lot n'est associé à ce bassin`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
generateAndSaveMesures().catch(console.error); 