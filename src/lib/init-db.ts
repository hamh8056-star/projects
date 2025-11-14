import clientPromise from "./mongodb";
import bcrypt from "bcryptjs";

export async function initializeDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Initialiser les utilisateurs
    const usersCollection = db.collection("users");
    const existingUsers = await usersCollection.countDocuments();
    
    if (existingUsers === 0) {
      await usersCollection.insertMany([
        {
          name: "Admin Principal",
          email: "admin@aqua.com",
          password: await bcrypt.hash("admin", 10),
          role: "admin",
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Opérateur 1",
          email: "operateur@aqua.com",
          password: await bcrypt.hash("operateur", 10),
          role: "operateur",
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Observateur 1",
          email: "observateur@aqua.com",
          password: await bcrypt.hash("observateur", 10),
          role: "observateur",
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Distributeur 1",
          email: "distributeur@aqua.com",
          password: await bcrypt.hash("distributeur", 10),
          role: "distributeur",
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log("✅ Utilisateurs initialisés");
    }

    // Initialiser les mesures
    const mesuresCollection = db.collection("mesures");
    const existingMesures = await mesuresCollection.countDocuments();
    
    if (existingMesures === 0) {
      const mesures = [];
      const now = new Date();
      
      // Générer des mesures pour les dernières 24h
      for (let i = 0; i < 50; i++) {
        const date = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 minutes d'intervalle
        mesures.push({
          param: ["Température", "pH", "Oxygène dissous", "Salinité"][Math.floor(Math.random() * 4)],
          value: (Math.random() * 10 + 15).toFixed(1) + (Math.random() > 0.5 ? "°C" : " mg/L"),
          bassin: `bassin${Math.floor(Math.random() * 3) + 1}`,
          date: date,
          createdAt: date
        });
      }
      
      await mesuresCollection.insertMany(mesures);
      console.log("✅ Mesures initialisées");
    }

    // Initialiser les alertes
    const alertesCollection = db.collection("alertes");
    const existingAlertes = await alertesCollection.countDocuments();
    
    if (existingAlertes === 0) {
      await alertesCollection.insertMany([
        {
          message: "pH trop bas dans le bassin 2",
          type: "warning",
          bassin: "bassin2",
          date: new Date(Date.now() - 1000 * 60 * 30),
          createdAt: new Date()
        },
        {
          message: "Oxygène dissous faible dans le bassin 1",
          type: "error",
          bassin: "bassin1",
          date: new Date(Date.now() - 1000 * 60 * 60),
          createdAt: new Date()
        },
        {
          message: "Température optimale dans tous les bassins",
          type: "info",
          bassin: "tous",
          date: new Date(Date.now() - 1000 * 60 * 120),
          createdAt: new Date()
        }
      ]);
      console.log("✅ Alertes initialisées");
    }

    console.log("🎉 Base de données initialisée avec succès !");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
    return false;
  }
} 