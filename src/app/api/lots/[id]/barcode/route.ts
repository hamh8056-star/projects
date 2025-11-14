import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// GET /api/lots/[id]/barcode - Obtenir les informations pour générer un code-barres
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est distributeur, admin ou opérateur
    const userRole = session.user?.role;
    if (!["distributeur", "admin", "operateur"].includes(userRole || "")) {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs, administrateurs et opérateurs" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const { id } = await params;
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }

    // Vérifier si le lot existe
    const lot = await db
      .collection("lots")
      .findOne({ _id: new ObjectId(id) });
    
    if (!lot) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    // Générer le code-barres (utiliser l'ID du lot comme valeur)
    const barcodeValue = lot._id.toString();

    // Enregistrer que le code-barres a été généré
    await db.collection("lots").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          barcodeGenere: true,
          barcodeGenerePar: session.user.id,
          barcodeGenereLe: new Date()
        } 
      }
    );

    return NextResponse.json({
      barcodeValue,
      lot: {
        _id: lot._id,
        nom: lot.nom,
        espece: lot.espece,
        quantite: lot.quantite
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations du lot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations du lot" },
      { status: 500 }
    );
  }
}

