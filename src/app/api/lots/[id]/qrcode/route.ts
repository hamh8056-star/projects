import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import QRCode from "qrcode";

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
    
    // Seuls les distributeurs peuvent générer des QR codes
    const userRole = session.user?.role;
    if (userRole !== "distributeur") {
      return NextResponse.json(
        { error: "Accès réservé aux distributeurs" },
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
    
    // Créer l'URL pour la page de traçabilité publique
    // Utiliser l'URL actuelle (localhost en local, URL publique en production)
    let baseUrl: string;
    
    // Essayer d'obtenir l'URL depuis la requête
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (req.nextUrl.protocol === "https:" ? "https" : "http");
    
    // Construire l'URL de base
    if (origin) {
      // Si on a un origin, l'utiliser directement
      baseUrl = origin;
    } else if (host) {
      // Sinon, construire depuis le host
      baseUrl = `${protocol}://${host}`;
    } else {
      // Fallback : utiliser la variable d'environnement ou Vercel
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://projects-amber-nu.vercel.app";
    }
    
    // Normaliser l'URL (enlever le trailing slash)
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const qrCodeUrl = `${baseUrl}/public/tracabilite/${id}`;
    
    // Log pour débogage
    console.log(`[QR Code] Génération pour lot ${id}`);
    console.log(`[QR Code] Origin: ${origin}, Host: ${host}, Protocol: ${protocol}`);
    console.log(`[QR Code] URL générée: ${qrCodeUrl}`);
    
    // Générer le QR code
    let qrCodeImage: string;
    try {
      qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#3B82F6", // Bleu
          light: "#FFFFFF", // Blanc
        },
      });
      
      console.log(`[QR Code] Image générée, longueur: ${qrCodeImage.length} caractères`);
      console.log(`[QR Code] Préfixe image: ${qrCodeImage.substring(0, 50)}...`);
    } catch (qrError) {
      console.error(`[QR Code] Erreur lors de la génération de l'image:`, qrError);
      throw new Error("Impossible de générer l'image du QR code");
    }
    
    // Mettre à jour le statut du QR code dans la base de données
    await db.collection("lots").updateOne(
      { _id: new ObjectId(id) },
      { $set: { qrCodeGenere: true } }
    );
    
    const responseData = {
      qrCodeImage,
      qrCodeUrl
    };
    
    console.log(`[QR Code] Réponse préparée:`, {
      hasImage: !!responseData.qrCodeImage,
      imageLength: responseData.qrCodeImage?.length,
      url: responseData.qrCodeUrl
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur lors de la génération du QR code:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du QR code" },
      { status: 500 }
    );
  }
} 