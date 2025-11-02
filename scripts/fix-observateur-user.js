// Script pour corriger l'utilisateur observateur
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function fixObservateur() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI non défini dans .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connexion à MongoDB réussie');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Supprimer tous les observateurs existants
    const deleteResult = await usersCollection.deleteMany({ 
      $or: [
        { email: 'observateur@aqua.com' },
        { role: 'observateur' }
      ]
    });
    console.log(`🗑️  ${deleteResult.deletedCount} utilisateur(s) observateur(s) supprimé(s)`);

    // Créer un nouvel utilisateur observateur
    const hashedPassword = await bcrypt.hash('observateur', 10);
    const result = await usersCollection.insertOne({
      name: 'Observateur 1',
      email: 'observateur@aqua.com',
      password: hashedPassword,
      role: 'observateur',
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Utilisateur observateur créé avec succès');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Email: observateur@aqua.com`);
    console.log(`   Mot de passe: observateur`);
    console.log(`   Actif: true`);

    // Vérifier que ça fonctionne
    const user = await usersCollection.findOne({ _id: result.insertedId });
    const testPassword = await bcrypt.compare('observateur', user.password);
    
    console.log('\n📋 Vérification:');
    console.log(`   Utilisateur trouvé: ${!!user}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Actif: ${user.actif}`);
    console.log(`   Mot de passe test: ${testPassword ? '✅ OK' : '❌ ÉCHEC'}`);

    if (testPassword && user.actif === true) {
      console.log('\n🎉 Succès! L\'utilisateur observateur est prêt à être utilisé.');
    } else {
      console.log('\n⚠️  Attention: Il y a un problème avec l\'utilisateur.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixObservateur();

