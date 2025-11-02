import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// Cette route supprime et recrée l'utilisateur observateur pour s'assurer qu'il est correct
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    const correctEmail = "observateur@aqua.com";
    const correctPassword = "observateur";
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    
    // Supprimer tous les observateurs existants (au cas où il y en a plusieurs)
    const deleteResult = await usersCollection.deleteMany({ 
      $or: [
        { email: correctEmail },
        { email: "Observateur@aqua.com" },
        { email: "OBSERVATEUR@aqua.com" },
        { role: "observateur" }
      ]
    });
    
    console.log(`[FORCE FIX] Supprimé ${deleteResult.deletedCount} utilisateur(s) observateur(s)`);
    
    // Créer un nouvel utilisateur observateur propre
    const result = await usersCollection.insertOne({
      name: "Observateur 1",
      email: correctEmail,
      password: hashedPassword,
      role: "observateur",
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Vérifier que ça fonctionne
    const newUser = await usersCollection.findOne({ _id: result.insertedId });
    const testPassword = await bcrypt.compare(correctPassword, newUser!.password);
    
    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur observateur recréé avec succès",
      deletedCount: deleteResult.deletedCount,
      insertedId: result.insertedId.toString(),
      user: {
        email: newUser!.email,
        role: newUser!.role,
        actif: newUser!.actif,
        hasPassword: !!newUser!.password,
        passwordTest: testPassword
      },
      credentials: {
        email: correctEmail,
        password: correctPassword
      }
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de la recréation de l'utilisateur observateur",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Chercher tous les observateurs
    const observateurs = await usersCollection.find({ 
      $or: [
        { email: "observateur@aqua.com" },
        { role: "observateur" }
      ]
    }).toArray();
    
    const observateursInfo = observateurs.map(u => ({
      _id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      actif: u.actif,
      hasPassword: !!u.password,
      passwordLength: u.password ? u.password.length : 0,
      passwordStartsWithDollar: u.password ? u.password.startsWith("$2") : false
    }));
    
    return NextResponse.json({
      success: true,
      count: observateurs.length,
      observateurs: observateursInfo
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 });
  }
}

