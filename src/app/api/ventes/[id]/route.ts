import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

// GET /api/ventes/[id] - Récupérer une vente spécifique
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
    if (!["distributeur", "admin", "operateur"].includes(userRole || "")) {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs, administrateurs et opérateurs" },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de vente invalide" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    const vente = await db.collection("ventes")
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
        { $unwind: { path: "$lot", preserveNullAndEmptyArrays: true } }
      ])
      .toArray();

    if (vente.length === 0) {
      return NextResponse.json(
        { error: "Vente non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(vente[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération de la vente:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la vente" },
      { status: 500 }
    );
  }
}

// PUT /api/ventes/[id] - Mettre à jour une vente
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
    if (!["distributeur", "admin", "operateur"].includes(userRole || "")) {
      return NextResponse.json(
        { error: "Accès réservé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { lotId, quantite, prixUnitaire, client, notes } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de vente invalide" },
        { status: 400 }
      );
    }

    if (!lotId || !ObjectId.isValid(lotId)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }

    if (!quantite || quantite <= 0) {
      return NextResponse.json(
        { error: "La quantité doit être supérieure à 0" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    // Récupérer la vente existante
    const venteExistante = await db.collection("ventes").findOne(filter);
    if (!venteExistante) {
      return NextResponse.json(
        { error: "Vente non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le lot existe
    const lot = await db.collection("lots").findOne({ _id: new ObjectId(lotId) });
    if (!lot) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    // Calculer la différence de quantité
    const ancienneQuantite = venteExistante.quantite;
    const differenceQuantite = quantite - ancienneQuantite;

    // Vérifier la disponibilité du lot
    const quantiteDisponible = lot.quantite + ancienneQuantite; // Restaurer l'ancienne quantité
    if (differenceQuantite > quantiteDisponible) {
      return NextResponse.json(
        { error: `Quantité insuffisante. Disponible: ${quantiteDisponible}` },
        { status: 400 }
      );
    }

    // Calculer le prix total
    const prixTotal = prixUnitaire ? prixUnitaire * quantite : null;

    // Mettre à jour la vente
    await db.collection("ventes").updateOne(
      filter,
      {
        $set: {
          lotId: new ObjectId(lotId),
          quantite,
          prixUnitaire: prixUnitaire || null,
          prixTotal,
          client: client || null,
          notes: notes || null,
          updatedAt: new Date()
        }
      }
    );

    // Mettre à jour la quantité du lot
    await db.collection("lots").updateOne(
      { _id: new ObjectId(lotId) },
      { $inc: { quantite: -differenceQuantite } }
    );

    // Si le lot a changé, restaurer l'ancien lot
    if (venteExistante.lotId.toString() !== lotId) {
      await db.collection("lots").updateOne(
        { _id: venteExistante.lotId },
        { $inc: { quantite: ancienneQuantite } }
      );
    }

    // Récupérer la vente mise à jour
    const venteMiseAJour = await db.collection("ventes")
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
        { $unwind: { path: "$lot", preserveNullAndEmptyArrays: true } }
      ])
      .toArray();

    return NextResponse.json(venteMiseAJour[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la vente" },
      { status: 500 }
    );
  }
}

// DELETE /api/ventes/[id] - Supprimer une vente
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
    if (!["distributeur", "admin", "operateur"].includes(userRole || "")) {
      return NextResponse.json(
        { error: "Accès réservé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de vente invalide" },
        { status: 400 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();

    const filter: any = { _id: new ObjectId(id) };
    if (userRole === "distributeur") {
      filter.distributeurId = session.user?.id;
    }

    // Récupérer la vente avant suppression
    const vente = await db.collection("ventes").findOne(filter);
    if (!vente) {
      return NextResponse.json(
        { error: "Vente non trouvée" },
        { status: 404 }
      );
    }

    // Restaurer la quantité du lot
    await db.collection("lots").updateOne(
      { _id: vente.lotId },
      { $inc: { quantite: vente.quantite } }
    );

    // Supprimer la vente
    const result = await db.collection("ventes").deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Vente supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la vente:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la vente" },
      { status: 500 }
    );
  }
}

