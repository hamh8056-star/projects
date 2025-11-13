import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import QRCode from "qrcode";
import os from "os";

// Fonction pour obtenir l'IP locale de la machine
function getLocalIP(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      // Ignorer les adresses internes et IPv6
      // family peut être 'IPv4' ou 4 selon la version de Node.js
      const isIPv4 = alias.family === 'IPv4' || alias.family === 4;
      if (isIPv4 && !alias.internal) {
        return alias.address;
      }
    }
  }
  return null;
}

// GET /api/lots/[id]/qrcode - Générer un QR code pour un lot
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "ID de lot invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier si le lot existe
    const lot = await db
      .collection("lots")
      .findOne({ _id: new ObjectId(params.id) });
    
    if (!lot) {
      return NextResponse.json(
        { error: "Lot non trouvé" },
        { status: 404 }
      );
    }
    
    // Créer l'URL pour la page de traçabilité publique
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";
    
    // Si on est en développement local (localhost), utiliser l'IP publique pour que le téléphone puisse y accéder
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      // Utiliser l'IP publique configurée ou détecter l'IP locale
      const publicIP = process.env.NEXT_PUBLIC_IP || "10.188.140.206";
      // Extraire le port de l'URL originale ou utiliser 3000 par défaut
      const port = baseUrl.match(/:(\d+)/)?.[1] || "3000";
      baseUrl = `http://${publicIP}:${port}`;
    }
    
    const qrCodeUrl = `${baseUrl}/public/tracabilite/${params.id}`;
    
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
      { _id: new ObjectId(params.id) },
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