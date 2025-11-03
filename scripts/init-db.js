/**
 * Script pour initialiser la base de données
 * Usage: node scripts/init-db.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Récupérer l'URI MongoDB
const uri = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ ERREUR: MONGO_URL ou MONGODB_URI n\'est pas défini dans les variables d\'environnement');
  console.error('💡 Créez un fichier .env.local avec:');
  console.error('   MONGO_URL=mongodb://localhost:27017/aquaai');
  console.error('   ou');
  console.error('   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aquaai');
  process.exit(1);
}

async function initializeDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db();

    // Initialiser les utilisateurs
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.countDocuments();
    
    if (existingUsers === 0) {
      console.log('📝 Création des utilisateurs par défaut...');
      await usersCollection.insertMany([
        {
          name: 'Admin Principal',
          email: 'admin@aqua.com',
          password: await bcrypt.hash('admin', 10),
          role: 'admin',
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Opérateur 1',
          email: 'operateur@aqua.com',
          password: await bcrypt.hash('operateur', 10),
          role: 'operateur',
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Observateur 1',
          email: 'observateur@aqua.com',
          password: await bcrypt.hash('observateur', 10),
          role: 'observateur',
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log('✅ Utilisateurs créés:');
      console.log('   - admin@aqua.com / admin (Admin)');
      console.log('   - operateur@aqua.com / operateur (Opérateur)');
      console.log('   - observateur@aqua.com / observateur (Observateur)');
    } else {
      console.log(`ℹ️  ${existingUsers} utilisateur(s) existent déjà`);
      
      // Mettre à jour les utilisateurs existants sans mot de passe
      const users = await usersCollection.find({}).toArray();
      for (const user of users) {
        if (!user.password) {
          let defaultPassword = '';
          if (user.email === 'admin@aqua.com') {
            defaultPassword = 'admin';
          } else if (user.email === 'operateur@aqua.com') {
            defaultPassword = 'operateur';
          } else if (user.email === 'observateur@aqua.com') {
            defaultPassword = 'observateur';
          } else {
            defaultPassword = 'password123';
          }
          
          await usersCollection.updateOne(
            { _id: user._id },
            { 
              $set: { 
                password: await bcrypt.hash(defaultPassword, 10),
                actif: user.actif !== undefined ? user.actif : true,
                updatedAt: new Date()
              } 
            }
          );
          console.log(`✅ Mot de passe ajouté pour ${user.email}`);
        }
      }
    }

    // Initialiser les mesures
    const mesuresCollection = db.collection('mesures');
    const existingMesures = await mesuresCollection.countDocuments();
    
    if (existingMesures === 0) {
      console.log('📊 Création des mesures de démonstration...');
      const mesures = [];
      const now = new Date();
      
      // Générer des mesures pour les dernières 24h
      for (let i = 0; i < 50; i++) {
        const date = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 minutes d'intervalle
        mesures.push({
          param: ['Température', 'pH', 'Oxygène dissous', 'Salinité'][Math.floor(Math.random() * 4)],
          value: (Math.random() * 10 + 15).toFixed(1) + (Math.random() > 0.5 ? '°C' : ' mg/L'),
          bassin: `bassin${Math.floor(Math.random() * 3) + 1}`,
          date: date,
          createdAt: date
        });
      }
      
      await mesuresCollection.insertMany(mesures);
      console.log(`✅ ${mesures.length} mesures créées`);
    } else {
      console.log(`ℹ️  ${existingMesures} mesure(s) existent déjà`);
    }

    // Initialiser les alertes
    const alertesCollection = db.collection('alertes');
    const existingAlertes = await alertesCollection.countDocuments();
    
    if (existingAlertes === 0) {
      console.log('🚨 Création des alertes de démonstration...');
      await alertesCollection.insertMany([
        {
          message: 'pH trop bas dans le bassin 2',
          type: 'warning',
          bassin: 'bassin2',
          date: new Date(Date.now() - 1000 * 60 * 30),
          createdAt: new Date()
        },
        {
          message: 'Oxygène dissous faible dans le bassin 1',
          type: 'error',
          bassin: 'bassin1',
          date: new Date(Date.now() - 1000 * 60 * 60),
          createdAt: new Date()
        },
        {
          message: 'Température optimale dans tous les bassins',
          type: 'info',
          bassin: 'tous',
          date: new Date(Date.now() - 1000 * 60 * 120),
          createdAt: new Date()
        }
      ]);
      console.log('✅ 3 alertes créées');
    } else {
      console.log(`ℹ️  ${existingAlertes} alerte(s) existent déjà`);
    }

    console.log('\n🎉 Base de données initialisée avec succès !\n');
    console.log('📋 Comptes disponibles:');
    console.log('   Email: admin@aqua.com | Password: admin');
    console.log('   Email: operateur@aqua.com | Password: operateur');
    console.log('   Email: observateur@aqua.com | Password: observateur\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter
initializeDatabase();

