import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const utilisateurs = await db.collection("users").find({}).toArray();
    return NextResponse.json(utilisateurs);
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur de connexion à la base de données" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("users").insertOne({ 
      ...data, 
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({ 
      success: true, 
      insertedId: result.insertedId,
      message: "Utilisateur créé avec succès"
    });
  } catch (error) {
    console.error("Erreur MongoDB:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 });
  }
}

// Fonction utilitaire pour insérer les utilisateurs initiaux
async function seedInitialUsers() {
  const client = await clientPromise;
  const db = client.db();
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
      await db.collection("users").insertOne(user);
    }
  }
} 