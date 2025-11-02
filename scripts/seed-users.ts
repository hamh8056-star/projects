import 'dotenv/config';
import clientPromise from "../src/lib/mongodb";
import bcrypt from "bcryptjs";

console.log("[DEBUG] MONGODB_URI:", process.env.MONGODB_URI);

async function seedInitialUsers() {
  try {
    console.log("[DEBUG] Tentative de connexion à MongoDB...");
    const client = await clientPromise;
    const db = client.db();
    console.log("[DEBUG] Connexion à MongoDB réussie.");
    const users = [
      {
        name: "Administrateur",
        email: "admin@aqua.com",
        password: await bcrypt.hash("admin", 10),
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Opérateur",
        email: "operateur@aqua.com",
        password: await bcrypt.hash("operateur", 10),
        role: "operateur",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Observateur",
        email: "observateur@aqua.com",
        password: await bcrypt.hash("observateur", 10),
        role: "observateur",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    for (const user of users) {
      const exists = await db.collection("users").findOne({ email: user.email });
      if (!exists) {
        const result = await db.collection("users").insertOne(user);
        console.log(`✅ Utilisateur ajouté: ${user.email} (id: ${result.insertedId})`);
      } else {
        console.log(`ℹ️  Déjà présent: ${user.email}`);
      }
    }
    console.log("\n✔️  Insertion terminée. Vous pouvez vous connecter avec ces comptes.");
    process.exit(0);
  } catch (err) {
    console.error("[ERREUR]", err);
    process.exit(1);
  }
}

seedInitialUsers(); 