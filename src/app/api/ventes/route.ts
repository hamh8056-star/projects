import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// GET /api/ventes - Récupérer toutes les ventes
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les distributeurs peuvent voir les ventes
    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    
    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Si c'est un distributeur, ne montrer que ses ventes
    const filter: any = {};
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    // Compter le total de ventes
    const total = await db.collection("ventes").countDocuments(filter);

    // Récupérer les ventes avec pagination
    const ventes = await db.collection("ventes")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "lots",
            localField: "lotId",
            foreignField: "_id",
            as: "lot"
          }
        },
        {
          $unwind: {
            path: "$lot",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { dateVente: -1, createdAt: -1 }
        },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    return NextResponse.json({
      ventes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des ventes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des ventes" },
      { status: 500 }
    );
  }
}

// POST /api/ventes - Créer une nouvelle vente
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les distributeurs peuvent créer des ventes
    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { lotId, quantite, dateVente, client: clientData, prixUnitaire, notes } = body;

    // Validation
    if (!lotId || !quantite) {
      return NextResponse.json(
        { error: "lotId et quantite sont requis" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(lotId)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    // Vérifier que le lot existe
    const lot = await db.collection("lots").findOne({ _id: new ObjectId(lotId) });
    if (!lot) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que la quantité est disponible
    if (quantite > (lot.quantite || 0)) {
      return NextResponse.json(
        { error: "Quantité insuffisante dans le lot" },
        { status: 400 }
      );
    }

    // Calculer le prix total
    const prixTotal = prixUnitaire ? prixUnitaire * quantite : 0;

    // Créer la vente
    const vente = {
      lotId: new ObjectId(lotId),
      quantite: parseInt(quantite),
      dateVente: dateVente ? new Date(dateVente) : new Date(),
      distributeurId: session.user?.id,
      client: clientData || null,
      prixUnitaire: prixUnitaire || 0,
      prixTotal,
      statut: "completee",
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("ventes").insertOne(vente);

    // Mettre à jour la quantité du lot
    await db.collection("lots").updateOne(
      { _id: new ObjectId(lotId) },
      { 
        $inc: { quantite: -parseInt(quantite) },
        $set: { updatedAt: new Date() }
      }
    );

    // Récupérer la vente créée avec les informations du lot
    const venteCreee = await db.collection("ventes")
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: "lots",
            localField: "lotId",
            foreignField: "_id",
            as: "lot"
          }
        },
        {
          $unwind: {
            path: "$lot",
            preserveNullAndEmptyArrays: true
          }
        }
      ])
      .toArray();

    return NextResponse.json(venteCreee[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la vente:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la vente" },
      { status: 500 }
    );
  }
}

