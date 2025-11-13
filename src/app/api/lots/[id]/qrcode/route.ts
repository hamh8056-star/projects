import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import QRCode from "qrcode";
import { getPublicUrlServer } from "@/lib/publicUrl";

// GET /api/lots/[id]/qrcode - Générer un QR code pour un lot
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
    
    // Créer l'URL pour la page de traçabilité publique
    // Utiliser la fonction utilitaire pour détecter automatiquement l'environnement
    const origin = req.headers.get("origin");
    const baseUrl = getPublicUrlServer(origin);
    const qrCodeUrl = `${baseUrl}/public/tracabilite/${id}`;
    
    // Générer le QR code
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#3B82F6", // Bleu
        light: "#FFFFFF", // Blanc
      },
    });
    
    // Mettre à jour le statut du QR code dans la base de données
    await db.collection("lots").updateOne(
      { _id: new ObjectId(id) },
      { $set: { qrCodeGenere: true } }
    );
    
    return NextResponse.json({
      qrCodeImage,
      qrCodeUrl
    });
  } catch (error) {
    console.error("Erreur lors de la génération du QR code:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du QR code" },
      { status: 500 }
    );
  }
} 