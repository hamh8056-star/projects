import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// GET /api/clients/[id] - Récupérer un client spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de client invalide" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    const client = await db.collection("clients").findOne(filter);

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur lors de la récupération du client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Mettre à jour un client
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { nom, email, telephone, adresse, notes } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de client invalide" },
        { status: 400 }
      );
    }

    if (!nom || nom.trim() === "") {
      return NextResponse.json(
        { error: "Le nom du client est requis" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    // Vérifier que le client existe
    const clientExistant = await db.collection("clients").findOne(filter);
    if (!clientExistant) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre client avec le même nom existe
    const autreClient = await db.collection("clients").findOne({ 
      nom: nom.trim(),
      _id: { $ne: new ObjectId(id) },
      distributeurId: userRole === "distributeur" ? session.user?.id : { $exists: false }
    });

    if (autreClient) {
      return NextResponse.json(
        { error: "Un autre client avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Mettre à jour le client
    await db.collection("clients").updateOne(
      filter,
      {
        $set: {
          nom: nom.trim(),
          email: email?.trim() || null,
          telephone: telephone?.trim() || null,
          adresse: adresse?.trim() || null,
          notes: notes?.trim() || null,
          updatedAt: new Date()
        }
      }
    );

    const clientMisAJour = await db.collection("clients").findOne(filter);
    return NextResponse.json(clientMisAJour);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Supprimer un client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de client invalide" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    const result = await db.collection("clients").deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du client:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du client" },
      { status: 500 }
    );
  }
}

