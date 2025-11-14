import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// GET /api/clients - Récupérer tous les clients
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les distributeurs peuvent voir les clients
    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    
    // Si c'est un distributeur, ne montrer que ses clients
    const filter: any = {};
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    const clients = await db.collection("clients")
      .find(filter)
      .sort({ nom: 1 })
      .toArray();

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Créer un nouveau client
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les distributeurs peuvent créer des clients
    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nom, email, telephone, adresse, notes } = body;

    // Validation
    if (!nom || nom.trim() === "") {
      return NextResponse.json(
        { error: "Le nom du client est requis" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    // Vérifier si un client avec le même nom existe déjà
    const clientExistant = await db.collection("clients").findOne({ 
      nom: nom.trim(),
      distributeurId: userRole === "distributeur" ? session.user?.id : { $exists: false }
    });

    if (clientExistant) {
      return NextResponse.json(
        { error: "Un client avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Créer le client
    const client = {
      nom: nom.trim(),
      email: email?.trim() || null,
      telephone: telephone?.trim() || null,
      adresse: adresse?.trim() || null,
      notes: notes?.trim() || null,
      distributeurId: userRole === "distributeur" ? session.user?.id : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("clients").insertOne(client);
    const clientCree = await db.collection("clients").findOne({ _id: result.insertedId });

    return NextResponse.json(clientCree, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}

