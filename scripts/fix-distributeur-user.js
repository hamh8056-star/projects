// Script pour corriger l'utilisateur distributeur
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function fixDistributeur() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGO_URL ou MONGODB_URI non défini dans .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connexion à MongoDB réussie');

    const db = client.db();
    const usersCollection = db.collection('users');

    const email = 'distributeur@aqua.com';
    const normalizedEmail = email.trim().toLowerCase();

    // Chercher l'utilisateur existant
    let user = await usersCollection.findOne({ email: normalizedEmail });
    
    // Si pas trouvé, chercher par email non normalisé
    if (!user) {
      user = await usersCollection.findOne({ 
        $or: [
          { email: email },
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }
        ]
      });
    }
    
    // Si toujours pas trouvé, chercher par rôle
    if (!user) {
      const distributeurs = await usersCollection.find({ role: 'distributeur' }).toArray();
      if (distributeurs.length > 0) {
        user = distributeurs[0];
        console.log(`⚠️  Utilisateur trouvé par rôle avec email: ${user.email}`);
      }
    }

    const hashedPassword = await bcrypt.hash('distributeur', 10);

    if (user) {
      // Mettre à jour l'utilisateur existant
      console.log('📝 Mise à jour de l\'utilisateur distributeur existant...');
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            email: normalizedEmail,
            name: 'Distributeur 1',
            password: hashedPassword,
            role: 'distributeur',
            actif: true,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Utilisateur distributeur mis à jour avec succès');
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Mot de passe: distributeur`);
      console.log(`   Actif: true`);

      // Vérifier que ça fonctionne
      const updatedUser = await usersCollection.findOne({ _id: user._id });
      const testPassword = await bcrypt.compare('distributeur', updatedUser.password);
      
      console.log('\n📋 Vérification:');
      console.log(`   Utilisateur trouvé: ${!!updatedUser}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Rôle: ${updatedUser.role}`);
      console.log(`   Actif: ${updatedUser.actif}`);
      console.log(`   Mot de passe test: ${testPassword ? '✅ OK' : '❌ ÉCHEC'}`);

      if (testPassword && updatedUser.actif === true) {
        console.log('\n🎉 Succès! L\'utilisateur distributeur est prêt à être utilisé.');
      } else {
        console.log('\n⚠️  Attention: Il y a un problème avec l\'utilisateur.');
      }
    } else {
      // Créer un nouvel utilisateur
      console.log('📝 Création d\'un nouvel utilisateur distributeur...');
      const result = await usersCollection.insertOne({
        name: 'Distributeur 1',
        email: normalizedEmail,
        password: hashedPassword,
        role: 'distributeur',
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Utilisateur distributeur créé avec succès');
      console.log(`   ID: ${result.insertedId}`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Mot de passe: distributeur`);
      console.log(`   Actif: true`);

      // Vérifier que ça fonctionne
      const newUser = await usersCollection.findOne({ _id: result.insertedId });
      const testPassword = await bcrypt.compare('distributeur', newUser.password);
      
      console.log('\n📋 Vérification:');
      console.log(`   Utilisateur trouvé: ${!!newUser}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Rôle: ${newUser.role}`);
      console.log(`   Actif: ${newUser.actif}`);
      console.log(`   Mot de passe test: ${testPassword ? '✅ OK' : '❌ ÉCHEC'}`);

      if (testPassword && newUser.actif === true) {
        console.log('\n🎉 Succès! L\'utilisateur distributeur est prêt à être utilisé.');
      } else {
        console.log('\n⚠️  Attention: Il y a un problème avec l\'utilisateur.');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixDistributeur();

