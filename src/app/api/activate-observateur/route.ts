import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Cette route met à jour tous les utilisateurs observateurs pour définir actif: true
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Mettre à jour tous les utilisateurs observateurs pour définir actif: true
    const result = await usersCollection.updateMany(
      { 
        $or: [
          { email: "observateur@aqua.com" },
          { role: "observateur" }
        ]
      },
      { 
        $set: { 
          actif: true,
          updatedAt: new Date()
        } 
      }
    );
    
    // Récupérer les utilisateurs mis à jour
    const updatedUsers = await usersCollection.find({
      $or: [
        { email: "observateur@aqua.com" },
        { role: "observateur" }
      ]
    }).toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: "Utilisateurs observateurs activés avec succès",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      users: updatedUsers.map(u => ({
        _id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        actif: u.actif,
        hasPassword: !!u.password
      }))
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de l'activation des observateurs",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Récupérer tous les observateurs
    const observateurs = await usersCollection.find({
      $or: [
        { email: "observateur@aqua.com" },
        { role: "observateur" }
      ]
    }).toArray();
    
    return NextResponse.json({
      success: true,
      count: observateurs.length,
      observateurs: observateurs.map(u => ({
        _id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        actif: u.actif,
        hasPassword: !!u.password
      }))
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 });
  }
}

