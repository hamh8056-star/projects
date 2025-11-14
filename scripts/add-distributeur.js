require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI n\'est pas défini dans .env');
  process.exit(1);
}

async function addDistributeur() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({ email: 'distributeur@aqua.com' });

    if (existingUser) {
      console.log('ℹ️  L\'utilisateur distributeur existe déjà');
      
      // Vérifier si le mot de passe est défini
      if (!existingUser.password) {
        console.log('📝 Ajout du mot de passe pour l\'utilisateur existant...');
        await usersCollection.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              password: await bcrypt.hash('distributeur', 10),
              actif: true,
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Mot de passe ajouté pour distributeur@aqua.com');
      } else {
        console.log('✅ L\'utilisateur distributeur est déjà configuré');
      }
    } else {
      // Créer l'utilisateur distributeur
      console.log('📝 Création de l\'utilisateur distributeur...');
      const result = await usersCollection.insertOne({
        name: 'Distributeur 1',
        email: 'distributeur@aqua.com',
        password: await bcrypt.hash('distributeur', 10),
        role: 'distributeur',
        actif: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Utilisateur distributeur créé avec succès!');
      console.log(`   ID: ${result.insertedId}`);
      console.log('   Email: distributeur@aqua.com');
      console.log('   Mot de passe: distributeur');
    }

    console.log('\n✔️  Opération terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addDistributeur();



