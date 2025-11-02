import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientPromise = await import("@/lib/mongodb").then(m => m.default);
    const client = await clientPromise;
    const db = client.db();
    const mesures = await db.collection("mesures").find({}).toArray();
    const alertes = await db.collection("alertes").find({}).toArray();
    const historique = [...mesures, ...alertes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(historique);
  } catch (error) {
    console.error("Erreur lors de la récupération des données historiques:", error);
    return NextResponse.json([]);
  }
} 